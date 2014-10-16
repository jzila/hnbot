
function Transformer(hnRef, transformerRef) {
    var now = new Date();
    console.log("launched on " + now.toString());
    console.log("UTC date: " + now.toUTCString());
    hnRef.child("topstories").on("child_changed", function(changedPostSnapshot) {

        var postId = changedPostSnapshot.val();
        var rank = changedPostSnapshot.name();

        hnRef.child("item/" + postId).once("value", function(postSnapshot) {

            var post = postSnapshot.val();
            var datetime = new Date(post.time * 1000);
            var day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][datetime.getDay()];

            var childIndex = "storiesByDayHour/" + day + "/" + datetime.getHours() + "/" + postId;
            var childNode = transformerRef.child(childIndex);

            childNode.once("value", function(childSnapshot) {

                var storedChild = childSnapshot.val();
                var d = new Date();
                post.minRank = rank;
                post.timeOfLastRankClimb = (d.getTime() / 1000);

                if (storedChild !== null) {
                    if (storedChild.minRank == null || rank < storedChild.minRank) {
                        childNode.update({minRank: rank, timeOfLastRankClimb: (d.getTime() / 1000)});
                    }
                } else {
                    childNode.set(post);
                }
                if (rank < 30) {
                    transformerRef.child("front" + childIndex).set(post);
                }
            });
        });
    });

    var newItemHandler = function(itemId, timeout) {
        setTimeout(function() {
            hnRef.child("item/" + itemId).once("value", function(itemSnapshot) {
                var item = itemSnapshot.val();
                if (item === null) {
                    console.log("null item " + itemId + ", trying again in " + (timeout * 2) + " ms");
                    return newItemHandler(itemId, timeout * 2);
                }
                if (item.type === "story") {
                    var d = new Date();
                    item.minRank = null;
                    item.timeOfLastRankClimb = (d.getTime() / 1000);
                    var datetime = new Date(item.time * 1000);
                    var day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][datetime.getDay()];
                    var childNode = transformerRef.child("storiesByDayHour/" + day + "/" + datetime.getHours() + "/" + itemId);
                    childNode.set(item);
                    console.log("new story posted: " + item.title);
                } else {
                    console.log("new item " + itemId);
                }
            });
        }, timeout);
    };

    hnRef.child("maxitem").on("value", function(changedItemSnapshot) {
        var itemId = changedItemSnapshot.val();
        var timeout = 1000;

        newItemHandler(itemId, 1000);
    });
};

module.exports = Transformer;
