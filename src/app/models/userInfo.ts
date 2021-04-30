
export class IUser {
  displayName: string;
  email: string;
  photoURL: string;
  state: string;
  uid: string;
  requestId?: string;

}

export interface IInfo {
  email: string;
  uid: string;
}

export class IUserState {
  state: string;
  email: string;
  uid: string;
}

export interface IFriend {
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
  state?: string;
}

export interface IRequest {
  receiver: string;
  sender: string;
  uid?: string;
}

export interface IRUserInfo {
  email: string;
  uid?: string;
  requestEmail: string;
}

export interface IStatus {
  status: string;
  uid: string;
}

export interface IConversation {
  messageId: string;
  myemail: string;
  wihtWhom: string;
  timestamp: string;
}
export interface IMsg {
  message: string;
  timestamp: string;
  sentBy: string;
  receiveBy: string;
  isPic: boolean;
}

export interface IGroup {
  conversationId: string;
  creator: string;
  groupName: string;
  groupPic: string;
}

export interface IMember {
  displayName: string;
  email: string;
  photoURL: string;
}


export interface INotifaction {
  receiver: string;
  receiverName: string;
  sender: string;
  senderPic: string;
  senderName: string;
  timestamp: string;
}