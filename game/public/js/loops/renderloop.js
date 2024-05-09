// render loop
function renderloop(){
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(scale, scale);

  if(staticBackground){staticBackground.render();}
  
  ctx.translate(camera.position.x, camera.position.y);

  // render behind background layers
  background.renderBehind();

  // render all collision blocks
  for(let i in allCollisionBlocks){
    allCollisionBlocks[i].render();
  };

  // render all interactable areas
  for(let i in allInteractableAreas){
    allInteractableAreas[i].render();
  };

  // render objects
  for(let i in match.objects){
    match.objects[i].render();
  };

  // render users behind
  for(let i in users){
    userOnlinePlayerRender(users[i]);
  };

  // render selectable players
  for(let i in selectablePlayers){
    if(!selectablePlayers[i].selected){selectablePlayers[i].render();}
  };

  // render player
  if(player.loaded){player.render();}

  // render particles
  for(let i in allParticles){
    allParticles[i].render();
  };

  // render front background layers
  background.renderFront();

  switch(match.state){
    case "choosing":
      // render object box
      box.render();

      // render objects in box
      for(let i in box.objects){
        box.objects[i].renderInChoosing();
      };
      break;

    case "placing":
      // render mouse
      mouse.render();

      // render objects in box
      for(let i in box.objects){
        box.objects[i].renderInPlacing();
      };
      break;

    case "playing":
      // Call function or trigger event for game over state
      break;
  };

  // render users in front
  for(let i in users){
    userCursorRender(users[i]);
  };

  ctx.restore();

  requestAnimationFrame(renderloop);
};