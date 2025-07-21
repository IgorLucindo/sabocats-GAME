// user choose map event
function onChooseMap({socket}){
    socket.on("ON_USER_CHOOSE_MAP", (updatedChooseMap) => {
        socket.broadcast.emit("ON_USER_CHOOSE_MAP_UPDATE", JSON.stringify(updatedChooseMap));
    });
};



// export functions
module.exports = {onChooseMap};