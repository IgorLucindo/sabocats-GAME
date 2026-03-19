function renderLoop(){
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);

  if(staticBackground) {staticBackground.render();}
  
  ctx.translate(camera.position.x, camera.position.y);

  // Render behind background layers
  background.renderBehind();

  // Render all collision blocks
  for(let i in allCollisionBlocks) {
    allCollisionBlocks[i].render();
  };

  // Render all interactable areas
  for(let i in allInteractableAreas) {
    allInteractableAreas[i].render();
  };

  // Render objects
  for(let i in match.objects) {
    match.objects[i].render();
  };

  // Render users behind
  for(let i in users) {
    userOnlinePlayerRender(users[i]);
  };

  // Render selectable players
  let selectablePlayers = gameState.get('objects.selectablePlayers');
  for(let i in selectablePlayers) {
    if(!selectablePlayers[i].selected){selectablePlayers[i].render();}
  };

  // Render player
  if(player.loaded) {player.render();}

  // Render particles
  for(let i in allParticles) {
    allParticles[i].render();
  };

  // Render front background layers
  background.renderFront();

  // Render state-specific elements (delegated to state handler)
  matchStateMachine.render();

  // Render users in front
  for(let i in users) {
    userCursorRender(users[i]);
  };

  ctx.restore();
}