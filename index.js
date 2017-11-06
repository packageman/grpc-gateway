'use strict'

const grpc = require('grpc');
const moment = require('moment');
const grpc_promise = require('grpc-promise');
const koa = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const app = new koa();

const PROTO_PATH = __dirname + `/protos/helloworld.proto`;

const welcome = ctx => {
  ctx.response.body = 'Welcome to use gRPC gateway';
};

const grpcProxy = async (ctx) => {
  const body = ctx.request.body;
  let serviceName = body.serviceName;
  let serviceMethod = body.serviceMethod;
  let args = body.args;

  let hello_world = grpc.load(PROTO_PATH).helloworld;
  let client = new hello_world[serviceName]('localhost:50051',
                                       grpc.credentials.createInsecure());
  let user = 'world';
  if (args.user) {
    user = args.user;
  }

  grpc_promise.promisifyAll(client);
  let result = await client[serviceMethod]().sendMessage({name: user});
  ctx.response.body = result.message;
};

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500;
    ctx.response.body = {
      message: err.message
    };
  }
};

const logger = async (ctx, next) => {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ${ctx.request.method} ${ctx.request.url} ${JSON.stringify(ctx.request.body)}`);
  await next();
};

app.use(bodyParser());
app.use(errorHandler);
app.use(logger);

app.use(route.get('/', welcome));
app.use(route.post('/grpc', grpcProxy));

app.listen(3000);
