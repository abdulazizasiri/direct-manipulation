($ => {
    let PHONE = true; 

    let mapDS = new Map();
    let drawingBox;
    
    
    let startDraw = event => {
        $.each(event.changedTouches, function (index, touch) {
            let newPosition = { left: touch.pageX, top: touch.pageY };
            touch.target.anchorX = touch.pageX;
            touch.target.anchorY = touch.pageY;
         

            let bubbleData = Math.floor(Math.random() * 5) + 100;
            drawingBox = $("<div></div>")
          
            .appendTo($('#drawing-area'))
            .addClass("box")
            .width(bubbleData)
            .height(bubbleData)
            .data({ 
                position: newPosition,
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 }
            })           
            .offset(newPosition); 

            
            mapDS.set(touch.identifier, touch.target);
        
            drawingBox.bind("touchstart", inflate);
            drawingBox.bind("touchmove", trackDrag);
            drawingBox.bind("touchmove", startMove);
            drawingBox.bind("touchend", unhighlight);
            drawingBox.bind("touchend", endDrag);
            mapDS.set(touch.identifier, touch.target);
        });
        event.preventDefault(); 
    };
    let inflate = event => {
        $.each(event.changedTouches, (index, touch) =>{
            let width = parseInt($(touch.target).css("width"));
            let height = parseInt($(touch.target).css("height"));
            $(touch.target).css('width', width * .30 + width);// inflate by 30%
            $(touch.target).css('height', height * .30 + height);
            if (width > 230){
                $(touch.target).remove();
            }

        });
        event.stopPropagation();
    };
    let trackDrag = event => {
        $.each(event.changedTouches, function (index, touch) {
            if (touch.target.movingBox){
                let newPosition = {
                    left: touch.pageX - touch.target.deltaX,
                    top: touch.pageY - touch.target.deltaY
                };
                $(touch.target).data('position', newPosition);
                touch.target.movingBox.offset(newPosition);
            } else if (drawingBox !== undefined) {
                let newPosition = {
                    left: (mapDS.get(touch.identifier).anchorX < touch.pageX) ?
                    mapDS.get(touch.identifier).anchorX : touch.pageX,
                    top: (mapDS.get(touch.identifier).anchorY < touch.pageY) ?
                    mapDS.get(touch.identifier).anchorY : touch.pageY
                };
                mapDS.get(touch.identifier).startDraw
                .data({
                    position: newPosition
                })
                .offset(newPosition)
                .width(Math.abs(touch.pageX - touch.target.anchorX))
                .height(Math.abs(touch.pageY - touch.target.anchorY));
            }
        });

        event.preventDefault();
    };
    let endDrag = event => {
        $.each(event.changedTouches, (index, touch) => {
            if (touch.target.movingBox) {
                touch.target.movingBox = null;
            }
        });
    };
        
        
    let unhighlight = event => $(event.currentTarget).removeClass("box-highlight");
    let startMove = event => {
        $.each(event.changedTouches, (index, touch) => {
                    // Highlight the element.
            $(touch.target).addClass("box-highlight");
        
                    // Take note of the box's current (global) location. Also, set its velocity and acceleration to
                    // nothing because, well, _finger_.
            let targetBox = $(touch.target);
            let startOffset = targetBox.offset();
            targetBox.data({
                position: startOffset,
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 }
            });
            touch.target.movingBox = targetBox;
            touch.target.deltaX = touch.pageX - startOffset.left;
            touch.target.deltaY = touch.pageY - startOffset.top;
        });
        
                // Eat up the event so that the drawing area does not
                // deal with it.
        event.stopPropagation();
    };
        
            /**
             * The motion update routine.
             */
    const FRICTION_FACTOR = 0.99;
    const buoyancy = -0.2;
    const ACCELERATION_COEFFICIENT = 0.05;
    const FRAME_RATE = 120;
    const FRAME_DURATION = 1000 / FRAME_RATE;
        
    let lastTimestamp = 0;
    let updateBoxes = timestamp => {
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }
        
                // Keep that frame rate under control.
        if (timestamp - lastTimestamp < FRAME_DURATION) {
            window.requestAnimationFrame(updateBoxes);
            return;
        }
        
        $("div.box").each((index, element) => {
            let $element = $(element);
            if ($element.hasClass("box-highlight")) {
                return;
            }
        
                    // Note how we base all of our calculations from the _model_...
            let s = $element.data('position');
            let v = $element.data('velocity');
            let a = $element.data('acceleration');
        
                    // The standard update-bounce sequence.
            if (PHONE){
                s.left -= v.x;
                s.top += v.y;
            }
            v.x += (a.x * ACCELERATION_COEFFICIENT * buoyancy);
            v.y += (a.y * ACCELERATION_COEFFICIENT * buoyancy);
            v.z += (a.z * ACCELERATION_COEFFICIENT * buoyancy);
        
            v.x *= FRICTION_FACTOR;
            v.y *= FRICTION_FACTOR;
            v.z *= FRICTION_FACTOR;
        
            let $parent = $element.parent();
            let bounds = {
                left: $parent.offset().left,
                top: $parent.offset().top
            };
        
            bounds.right = bounds.left + $parent.width();
            bounds.bottom = bounds.top + $parent.height();
        
            if ((s.left <= bounds.left) || (s.left + $element.width() > bounds.right)) {
                s.left = (s.left <= bounds.left) ? bounds.left : bounds.right - $element.width();
                v.x = -v.x;
            }
        
            if ((s.top <= bounds.top) || (s.top + $element.height() > bounds.bottom)) {
                s.top = (s.top <= bounds.top) ? bounds.top : bounds.bottom - $element.height();
                v.y = -v.y;
            }
        
                    // ...and the final result is sent on a one-way trip to the _view_.
            $(element).offset(s);
        });
        lastTimestamp = timestamp;
        window.requestAnimationFrame(updateBoxes);
    };
    let finiteLife = function() {
       
        $("div.box").each(function(index, element){
            let width = element.width();
            let height = element.height();

            element.width(width * 0.10 + width);
            element.height(height * 0.10 + height);

       
        });
       
    };

    let setDrawingArea = jQueryElements => {
            
                // Set up any pre-existing box elements for touch behavior.
        jQueryElements
                    .addClass("drawing-area")
        
                    // Event handler setup must be low-level because jQuery
                    // doesn't relay touch-specific event properties.
                    .each((index, element) => {
                        $(element)
                        .bind('touchstart', startDraw)
                        .bind("touchend", unhighlight);
                       
                    })
        
                    .find("div.box").each((index, element) => {
                        $(element)

                        .bind("touchstart", inflate)
                        .bind("touchmove", trackDrag)
                        .bind("touchmove", startMove)
                        .bind("touchend", unhighlight)
                        .bind("touchend", endDrag)
                        .bind('touchend', finiteLife)

                            .data({
                                position: $(element).offset(),
                                velocity: { x: 0, y: 0, z: 0 },
                                acceleration: { x: 0, y: 0, z: 0 }
                            });
            
                    });
                // In this sample, device acceleration is the _sole_ determiner of a box's acceleration.
        window.ondevicemotion = event => {
            let a = event.accelerationIncludingGravity;
            $("div.box").each((index, element) => {
                $(element).data('acceleration', a);  
            });
        };
        window.requestAnimationFrame(updateBoxes);
    };
        
    $.fn.boxesWithPhysics = function () {
        setDrawingArea(this);
        return this;
    };
})(jQuery);
        