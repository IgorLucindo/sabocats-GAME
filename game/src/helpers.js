// AABB collision test between two rect-like objects
export function collision({ object1, object2 }) {
    return (
        object1.position.y + object1.height >= object2.position.y &&
        object1.position.y <= object2.position.y + object2.height &&
        object1.position.x <= object2.position.x + object2.width &&
        object1.position.x + object1.width >= object2.position.x
    );
}

// Linear interpolation
export function lerp(currentValue, destinationValue, time) {
    return currentValue * (1 - time) + destinationValue * time;
}

// True when the cursor is inside the given object's bounding box
export function mouseOverObject({ object, cursorSystem }) {
    return (
        object.position.x <= cursorSystem.canvasPosition.x &&
        object.position.x + object.width >= cursorSystem.canvasPosition.x &&
        object.position.y <= cursorSystem.canvasPosition.y &&
        object.position.y + object.height >= cursorSystem.canvasPosition.y
    );
}

// True when the cursor is inside the given object's bounding box (screen-space coords)
export function mouseOverObjectScreen({ object, cursorSystem }) {
    const { x, y } = cursorSystem.screenPosition;
    return (
        object.position.x <= x &&
        object.position.x + object.width >= x &&
        object.position.y <= y &&
        object.position.y + object.height >= y
    );
}

// Rotate a rect 90° clockwise around a centre point; returns the new rect
export function rotate90deg({ object, center }) {
    const rotatedX = -(object.position.y - center.y) + center.x;
    const rotatedY = (object.position.x - center.x) + center.y;
    return {
        position: { x: rotatedX - object.height, y: rotatedY },
        width: object.height,
        height: object.width
    };
}

// Map loginOrder (1-4) to cursor color (red, blue, yellow, green)
export function getCursorColor(loginOrder) {
    const colors = ['red', 'blue', 'yellow', 'green'];
    return colors[Math.min(loginOrder - 1, 3)] || 'red';
}
