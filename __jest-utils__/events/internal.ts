import { LambdaCall } from '../../src/event-source/aws/legacy-internal-lambda';

const internalEventBase: LambdaCall = {
  path: '/create',
  request: {
    headers: {},
    params: {},
  },
};

export function makeInternalEvent(cb: (event: LambdaCall) => LambdaCall): LambdaCall {
  return cb(JSON.parse(JSON.stringify(internalEventBase)));
}
