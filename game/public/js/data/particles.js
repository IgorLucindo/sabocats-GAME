function createParticle(key){
    switch(key){
        case "jump":
            const jump = new Particle({
                relativePosition: {x: 5*playerScale, y: 30*playerScale},
                imageSrc: "assets/images/particles/jump.png",
                frameRate: 6,
                frameBuffer: 5
            });
            return jump;

        case "wallSlideJump":
            const wallSlideJump = new Particle({
                relativePosition: {x: 21*playerScale, y: 30*playerScale},
                imageSrc: "assets/images/particles/wallSlideJump.png",
                frameRate: 6,
                frameBuffer: 5
            });
            return wallSlideJump;

        case "wallSlideJumpLeft":
            const wallSlideJumpLeft = new Particle({
                relativePosition: {x: -3*playerScale, y: 30*playerScale},
                imageSrc: "assets/images/particles/wallSlideJumpLeft.png",
                frameRate: 6,
                frameBuffer: 5
            });
            return wallSlideJumpLeft;

        case "fall":
            const fall = new Particle({
                relativePosition: {x: 5*playerScale, y: 30*playerScale},
                imageSrc: "assets/images/particles/fall.png",
                frameRate: 5,
                frameBuffer: 5
            });
            return fall;

        case "turn":
            const turn = new Particle({
                relativePosition: {x: -13*playerScale, y: 30*playerScale},
                imageSrc: "assets/images/particles/turn.png",
                frameRate: 4,
                frameBuffer: 7
            });
            return turn;

        case "turnLeft":
            const turnLeft = new Particle({
                relativePosition: {x: 30*playerScale, y: 30*playerScale},
                imageSrc: "assets/images/particles/turnLeft.png",
                frameRate: 4,
                frameBuffer: 7
            });
            return turnLeft;
    };
};