export type ClientToServerMessage =
  | {
      type: 'join';
    }| {
      type: 'join2';
    };

export type ServerToClientMessage =
  | {
      type: 'joined';
    }  | {
      type: 'joined2';
    };
