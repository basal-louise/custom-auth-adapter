import * as sdk from "@basaldev/blocks-backend-sdk";
import { defaultAdapter, AuthAppConfig, ServiceOptsWithOAuth } from "@basaldev/blocks-auth-service";

/**
 * A hook function called after the adapter is created
 * This hook can be used to customize the adapter instance
 * 
 * @param {defaultAdapter.AuthDefaultAdapter} adapter Default adapter instance
 * @returns {defaultAdapter.AuthDefaultAdapter} Updated adapter instance
 */
export function adapterCreated(adapter: defaultAdapter.AuthDefaultAdapter): defaultAdapter.AuthDefaultAdapter {
  /**
   * Customize handlers and validators for an existing endpoint here
   * https://docs.nodeblocks.dev/docs/how-tos/customization/customizing-adapters#customizing-handlers-and-validators-for-an-existing-endpoint
   */

  const updatedAdapter = sdk.adapter.modifyHandler(adapter, 'checkToken', (oldHandler) => {
    const newHandler = async (logger: sdk.Logger, context: sdk.adapter.AdapterHandlerContext) => {
      const user = await oldHandler(logger, context);
      const authSecrets = { 
                            authEncSecret: process.env.ADAPTER_AUTH_ENC_SECRET, 
                            authSignSecret: process.env.ADAPTER_AUTH_SIGN_SECRET 
                          };
      const token = context.body.token;
      const decrypted = sdk.crypto.decryptAndVerifyJWT(authSecrets, token)
      return {
        ...user,
        data: {
          userId: (user.data as { userId: string }).userId,
          exp: (decrypted as any).exp,
        }
      };
    };
    return newHandler
  });
  return updatedAdapter;
}