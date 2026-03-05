export type Platform = 'apns' | 'fcm' | 'wns' | 'mpns' | 'adm' | 'baidu';

export interface INotificationHub {
  name: string;
  registrationTtl?: string;
  authorizationRules?: INotificationHubAuthorizationRule[];
}

export interface INotificationHubAuthorizationRule {
  keyName: string;
  primaryKey: string;
  secondaryKey: string;
  rights: ('Manage' | 'Send' | 'Listen')[];
}

export interface IRegistration {
  registrationId: string;
  expirationTime: Date;
  etag: string;
  tags?: string[];
  pushChannel: string;
  platform: Platform;
}

export interface IApnsRegistration extends IRegistration {
  platform: 'apns';
  deviceToken: string;
}

export interface IFcmRegistration extends IRegistration {
  platform: 'fcm';
  fcmRegistrationId: string;
}

export interface IWnsRegistration extends IRegistration {
  platform: 'wns';
  channelUri: string;
}

export interface GetRegistrationsDto {
  top?: number;
  continuationToken?: string;
}

export interface RegistrationsResponse {
  registrations: IRegistration[];
  continuationToken?: string;
}

export interface SendNotificationDto {
  platform: Platform;
  payload: string;
  tags?: string[];
  tagExpression?: string;
}

export interface NotificationOutcome {
  trackingId?: string;
  state: 'Enqueued' | 'DetailedStateAvailable' | 'Abandoned' | 'Unknown';
}
