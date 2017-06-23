import Data from './Data';

export default function(eventName) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (args.length && typeof args[args.length - 1] === "function") {
    var callback = args.pop();
  }


  const id = Data.ddp.method(eventName, args);
  /* BEGIN OPTIMISTIC-UI EDITS */
  const callId = id;
  if (Meteor.optimisticCalls && eventName in Meteor.optimisticCalls) {
    const updateDocument = (collection, documentId, fields) => {
      Meteor.ddp.emit("changed", {
        msg: "changed",
          collection,
          id: documentId,
          fields
      });

      setTimeout(() => {
        const key = collection + "_" + documentId;
        if (!(key in Data.ddp.expectedUpdates)) {
          Data.ddp.expectedUpdates[key] = {};
        }
        Data.ddp.expectedUpdates[key][callId] = {
          callReturned: false,
          expectedFields: fields
        };
        if (!(callId in Data.ddp.expectedUpdatesByCallId)) {
          Data.ddp.expectedUpdatesByCallId[callId] = [];
        }
        Data.ddp.expectedUpdatesByCallId[callId].push(key);
      }, 0);
    };

    Meteor.optimisticCalls[eventName]({
      args,
      updateDocument
    });
  }
  /* END OPTIMISTIC-UI EDITS */
  Data.calls.push({
    id: id,
    callback: callback
  });
}