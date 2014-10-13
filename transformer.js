
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
                    if (rank < storedChild.minRank) {
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
};

module.exports = Transformer;
