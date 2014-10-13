
function Transformer(hnRef, transformerRef) {
    hnRef.child("topstories").on("child_changed", function(changedPostSnapshot) {

        var postId = changedPostSnapshot.val();
        var rank = changedPostSnapshot.name();

        hnRef.child("item/" + postId).once("value", function(postSnapshot) {

            var post = postSnapshot.val();
            var datetime = new Date(post.time * 1000);
            var day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][datetime.getDay()];

            console.log("postID: " + postId + ", rank: " + rank + ", created on day: " + day + ", hour: " + datetime.getHours());

            var childIndex = "storiesByDayHour/" + day + "/" + datetime.getHours() + "/" + postId;
            var childNode = transformerRef.child(childIndex);

            childNode.once("value", function(childSnapshot) {

                var storedChild = childSnapshot.val();
                var d = new Date();
                post.minRank = rank;
                post.timeOfLastRankClimb = d.getTime();

                if (storedChild !== null) {
                    if (rank < storedChild.minRank) {
                        childNode.update({minRank: rank, timeOfLastRankClimb: d.getTime()});
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
