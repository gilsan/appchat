
export class IUser {
  displayName: string;
  email: string;
  photoURL: string;
  state: string;
  uid: string;
  requestId?: string;
  groupname?: string;
  creater?: string;

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
  displayName: string;
  groupName: string;
  groupPic: string;
  groupId: string;
  uid: string;
}

export interface IGroupMsg {
  isPic: boolean;
  message: string;
  room: string;
  sentBy: string;
  timestamp: string;
}

export interface IMember {
  creater: string;
  displayName: string;
  email: string;
  groupName: string;
  photoURL: string;
  uid: string;
  state?: string;
  id?: string;

}


export interface INotifaction {
  groupId: string;
  memberofUid: string;
  receiver: string;
  receiverName: string;
  receiverPic: string;
  receiverUid: string;
  room: string;
  senderUid: string;
  sentBy: string;
  timestamp: string;
}

