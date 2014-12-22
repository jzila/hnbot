
function Transformer(hnRef, transformerRef) {
    var now = new Date();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    console.log("launched on " + now.toString());
    console.log("UTC date: " + now.toUTCString());

    hnRef.child("topstories").on("child_changed", function(changedPostSnapshot) {

        var postId = changedPostSnapshot.val();
        var rank = changedPostSnapshot.name();

        hnRef.child("item/" + postId).once("value", function(postSnapshot) {

            var post = postSnapshot.val();
            var datetime = new Date(post.time * 1000);
            var day = days[datetime.getDay()];

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
                    // Exponential backoff
                    console.log("null item " + itemId + ", trying again in " + (timeout * 2) + " ms");
                    return newItemHandler(itemId, timeout * 2);
                }
                if (item.type === "story") {
                    var d = new Date();
                    item.minRank = null;
                    item.timeOfLastRankClimb = (d.getTime() / 1000);
                    var datetime = new Date(item.time * 1000);
                    var day = days[datetime.getDay()];
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

    transformerRef.on("value", function(dataSnapshot) {
        var allData = dataSnapshot.val();
        var stories = allData["storiesByDayHour"];
        var topStories = allData["frontstoriesByDayHour"];

        var percentageSeries = [];
        var storySeries = [];
        var topStorySeries = [];
        var hourOrder = Array.apply(null, {length: 24}).map(Number.call, Number)
                     
        if (stories !== undefined) {
            for (var i in days) {
                var day = days[i];
                for (var h in hourOrder) {
                    var hour = hourOrder[h];
                    var count = 0, topCount = 0, percentage = 0;
                    if (topStories[day] !== undefined
                            && topStories[day][hour] !== undefined) {
                        count = Object.keys(stories[day][hour]).length;
                        topCount = Object.keys(topStories[day][hour]).length;
                        percentage = 100 * (topCount/count);
                    }
                    percentageSeries.push(percentage);
                    storySeries.push(count);
                    topStorySeries.push(topCount);
                }
            }
        }
        
        var shiftedPercentages = percentageSeries.splice(0, 8);
        var shiftedStories = storySeries.splice(0, 8);
        var shiftedTopStories = topStorySeries.splice(0, 8);
        Array.prototype.push.apply(percentageSeries, shiftedPercentages);
        Array.prototype.push.apply(storySeries, shiftedStories);
        Array.prototype.push.apply(topStorySeries, shiftedTopStories);

        var seriesRef = transformerRef.child("series");
        seriesRef.child("percentages").set(percentageSeries);
        seriesRef.child("stories").set(storySeries);
        seriesRef.child("topstories").set(topStorySeries);
        console.log("Series recalculated.");
    });
};

module.exports = Transformer;
