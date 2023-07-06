function createOnlinePlayer({id, position = {x: 0, y: 0}, scale = 1, currentSprite = "idleSit"}){
    switch(id){
        case "blackCat":
            const onlinePlayer = new OnlinePlayer({
                position: position,
                scale: scale,
                animations: {
                    idleSit: {imageSrc: "assets/images/players/blackCat/idleSit.png", frameRate: 18, frameBuffer: 9},
                    idleSitLeft: {imageSrc: "assets/images/players/blackCat/idleSitLeft.png", frameRate: 18, frameBuffer: 9},
                    idleStand: {imageSrc: "assets/images/players/blackCat/idleStand.png", frameRate: 8, frameBuffer: 8},
                    idleStandLeft: {imageSrc: "assets/images/players/blackCat/idleStandLeft.png", frameRate: 8, frameBuffer: 8},
                    idleSitting: {imageSrc: "assets/images/players/blackCat/idleSitting.png", frameRate: 6, frameBuffer: 8},
                    idleSittingLeft: {imageSrc: "assets/images/players/blackCat/idleSittingLeft.png", frameRate: 6, frameBuffer: 8},
                    walk: {imageSrc: "assets/images/players/blackCat/walk.png", frameRate: 8, frameBuffer: 6},
                    walkLeft: {imageSrc: "assets/images/players/blackCat/walkLeft.png", frameRate: 8, frameBuffer: 6},
                    run:{imageSrc: "assets/images/players/blackCat/run.png", frameRate: 8, frameBuffer: 4},
                    runLeft:{imageSrc: "assets/images/players/blackCat/runLeft.png", frameRate: 8, frameBuffer: 4},
                    jump: {imageSrc: "assets/images/players/blackCat/jump.png", frameRate: 3, frameBuffer: 8},
                    jumpLeft: {imageSrc: "assets/images/players/blackCat/jumpLeft.png", frameRate: 3, frameBuffer: 8},
                    fall: {imageSrc: "assets/images/players/blackCat/fall.png", frameRate: 3, frameBuffer: 8},
                    fallLeft: {imageSrc: "assets/images/players/blackCat/fallLeft.png", frameRate: 3, frameBuffer: 8},
                    float: {imageSrc: "assets/images/players/blackCat/float.png", frameRate: 1},
                    floatLeft: {imageSrc: "assets/images/players/blackCat/floatLeft.png", frameRate: 1},
                    wallSlide: {imageSrc: "assets/images/players/blackCat/wallSlide.png", frameRate: 3, frameBuffer: 8},
                    wallSlideLeft: {imageSrc: "assets/images/players/blackCat/wallSlideLeft.png", frameRate: 3, frameBuffer: 8}
                },
                currentSprite: currentSprite
            });
            return onlinePlayer;
    };
};