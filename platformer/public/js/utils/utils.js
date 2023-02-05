// detect collision between 2 objects
function collision({object1, object2}){
    return (
        object1.position.y + object1.height >= object2.position.y &&
        object1.position.y <= object2.position.y + object2.height &&
        object1.position.x <= object2.position.x + object2.width &&
        object1.position.x + object1.width >= object2.position.x
    );
};



// detect if mouse is over object
function mouseOverObject({object}){
    return (
        object.position.x <= mouse.position.x/scale - camera.position.x &&
        object.position.x + object.width>= mouse.position.x/scale - camera.position.x &&
        object.position.y <= mouse.position.y/scale - camera.position.y &&
        object.position.y + object.height >= mouse.position.y/scale - camera.position.y
    );
};



// check if all players reached finish area
function checkAllPlayersFinished(){
    for(let i in users){
        if(users[i].id != user.id){
            console.log(users[i].onlinePlayer)
            if(!users[i].onlinePlayer.finished){return false;}
        }
    };
    return true;
};



// update users online players
function usersOnlinePlayersUpdate(){
    for(let i in users){
        if(users[i].id != user.id){
            const onlinePlayer = users[i].onlinePlayer;
            if(onlinePlayer.loaded){
                onlinePlayer.switchSprite(onlinePlayer.currentSprite);
                onlinePlayer.update();
            }
        }
    };
};