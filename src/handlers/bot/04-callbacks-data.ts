import { CallbackData } from "gramio";
import { CallbackId } from "../../enums/callback-id.enum";
import { CallbackKey } from "../../enums/callback-key.enum";

export const viewAlertGroup = new CallbackData(CallbackId.VIEW_ALERT_GROUP).string(CallbackKey.COIN_ID);
export const backToAlertGroups = new CallbackData(CallbackId.BACK_TO_ALERT_GROUPS);
export const viewAlertDetails = new CallbackData(CallbackId.VIEW_ALERT_DETAILS).string(CallbackKey.ALERT_ID);
export const backToAlertGroup = new CallbackData(CallbackId.BACK_TO_ALERT_GROUP).string(CallbackKey.COIN_ID);
export const viewCurrentPriceFromAlert = new CallbackData(CallbackId.VIEW_CURRENT_PRICE_FROM_ALERT).string(CallbackKey.ALERT_ID);
export const backToAlertDetails = new CallbackData(CallbackId.BACK_TO_ALERT_DETAILS).string(CallbackKey.ALERT_ID);
export const deleteAlert = new CallbackData(CallbackId.DELETE_ALERT).string(CallbackKey.ALERT_ID);
export const deleteAllAlerts = new CallbackData(CallbackId.DELETE_ALL_ALERTS);
export const cancelDeleteAllAlerts = new CallbackData(CallbackId.CANCEL_DELETE_ALL_ALERTS);
export const selectSearchResult = new CallbackData(CallbackId.SELECT_SEARCH_RESULT)
  .string(CallbackKey.SESSION_ID)
  .string(CallbackKey.RESULT_INDEX);
export const refreshSelectedPrice = new CallbackData(CallbackId.REFRESH_SELECTED_PRICE)
  .string(CallbackKey.SESSION_ID)
  .string(CallbackKey.RESULT_INDEX);
