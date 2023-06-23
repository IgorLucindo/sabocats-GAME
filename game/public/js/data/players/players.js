function createPlayer({id, position, scale = 1, selectablePlayer = null}){
    const particles = new Particle({
        position: position,
        imageSrc: "assets/images/particles/jump.png",
        frameRate: 6,
        scale: scale,
        animations: {
            jump: {position: {x: 5*scale, y: 30*scale}, imageSrc: "assets/images/particles/jump.png", frameRate: 6, frameBuffer: 5},
            wallSlideJump: {position: {x: 21*scale, y: 30*scale}, imageSrc: "assets/images/particles/wallSlideJump.png", frameRate: 6, frameBuffer: 5},
            wallSlideJumpLeft: {position: {x: -3*scale, y: 30*scale}, imageSrc: "assets/images/particles/wallSlideJumpLeft.png", frameRate: 6, frameBuffer: 5},
            jump: {position: {x: 5*scale, y: 30*scale}, imageSrc: "assets/images/particles/jump.png", frameRate: 6, frameBuffer: 5},
            fall: {position: {x: 5*scale, y: 30*scale}, imageSrc: "assets/images/particles/fall.png", frameRate: 5, frameBuffer: 5},
            turn: {position: {x: -13*scale, y: 30*scale}, imageSrc: "assets/images/particles/turn.png", frameRate: 4, frameBuffer: 7},
            turnLeft: {position: {x: 30*scale, y: 30*scale}, imageSrc: "assets/images/particles/turnLeft.png", frameRate: 4, frameBuffer: 7}
        }
    });

    switch(id){
        case "blackCat":
            const player = new Player({
                position: position,
                imageSrc: "assets/images/players/blackCat/idleSit.png",
                frameRate: 12,
                scale: scale,
                animations: {
                    idleSit: {imageSrc: "assets/images/players/blackCat/idleSit.png", frameRate: 12, frameBuffer: 9},
                    idleSitLeft: {imageSrc: "assets/images/players/blackCat/idleSitLeft.png", frameRate: 12, frameBuffer: 9},
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
                background: background,
                selectablePlayer: selectablePlayer,
                particles: particles
            });
            return player;
    };
};