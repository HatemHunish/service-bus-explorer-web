export type RelayType = 'HybridConnection' | 'WcfRelay';

export interface IRelay {
  name: string;
  relayType: RelayType;
  createdAt: Date;
  updatedAt: Date;
  listenerCount?: number;
  requiresClientAuthorization: boolean;
  userMetadata?: string;
}

export interface IHybridConnection extends IRelay {
  relayType: 'HybridConnection';
  requiresClientAuthorization: boolean;
}

export interface IWcfRelay extends IRelay {
  relayType: 'WcfRelay';
  isDynamic: boolean;
}

export interface IRelayAuthorizationRule {
  keyName: string;
  primaryKey: string;
  secondaryKey: string;
  rights: ('Manage' | 'Send' | 'Listen')[];
}
