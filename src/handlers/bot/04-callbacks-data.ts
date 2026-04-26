import { CallbackData } from "gramio";
import { CallbackId } from "../../enums/callback-id.enum";
import { CallbackKey } from "../../enums/callback-key.enum";

export const openAlertDetails = new CallbackData(CallbackId.OPEN_ALERT_DETAILS).string(CallbackKey.ALERT_ID);
export const deleteAlert = new CallbackData(CallbackId.DELETE_ALERT).string(CallbackKey.ALERT_ID);
export const deleteAllAlerts = new CallbackData(CallbackId.DELETE_ALL_ALERTS);
export const cancelDeleteAlert = new CallbackData(CallbackId.CANCEL_DELETE_ALERT);
export const cancelDeleteAllAlerts = new CallbackData(CallbackId.CANCEL_DELETE_ALL_ALERTS);
export const selectSearchResult = new CallbackData(CallbackId.SELECT_SEARCH_RESULT)
  .string(CallbackKey.SESSION_ID)
  .string(CallbackKey.RESULT_INDEX);
export const refreshSelectedPrice = new CallbackData(CallbackId.REFRESH_SELECTED_PRICE)
  .string(CallbackKey.SESSION_ID)
  .string(CallbackKey.RESULT_INDEX);
export const currentPriceFromActiveAlert = new CallbackData(CallbackId.CURRENT_PRICE_FROM_ACTIVE_ALERT).string(CallbackKey.ALERT_ID);
