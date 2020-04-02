import {BaseUserController, DoThingRequest, DoThingResponse, validateDoThingRequest} from './apiBase';
import {ValidationError} from '../apiUtils/errors';

export class UserController extends BaseUserController {
  async doThing(request: DoThingRequest, headers?: any): Promise<DoThingResponse> {
    if (!validateDoThingRequest(request)) {
      throw new ValidationError();
    }
    return {
      jwt: request.shoes!,
    };
  }
}
