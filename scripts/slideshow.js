window.onload = function () {


    // Global variables
    var first_image_nb = 0,
        last_image_nb = 113,
        images_urls = new Array(),
        canvas = document.getElementsByTagName("canvas")[0];

    // Initialization of canvas resolution
    canvas.width  = 768;
    canvas.height = 512;
    
    // Generating images url
    for (var i = first_image_nb; i <= last_image_nb; i++) {
        images_urls[i] = "http://prodibiimagewe.blob.core.windows.net/timelapse/IMG_" + i.toString() + ".JPG";
    };




    //*************************************** Loader Class declaration ****************************************//


    function Loader(canvas, size, circle_line_width){
        this.canvas = canvas;
        this.percent = 0;
        this.size = size;
        this.context = canvas.getContext('2d');

        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);

        this.radius = (this.size - circle_line_width) / 2;
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, Math.PI * 2, false);
        this.context.strokeStyle = '#efefef';
        this.context.lineCap = 'butt'; // butt, round or square
        this.context.lineWidth = circle_line_width;
        this.context.stroke();
    }



    Loader.prototype.setPercent = function(percent) {
        this.percent = percent;

        percent = Math.min(Math.max(0, percent || 1), 1);
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, Math.PI * 2 * percent, false);
        this.context.strokeStyle = '#3498db';
        this.context.stroke();

    };








    //*************************************** Slideshow Class declaration ****************************************//




    function Slideshow(canvas, images_urls){
        this.canvas = canvas;
        this.canvas_context = this.canvas.getContext('2d');
        this.images_urls = images_urls;
        this.images = new Array();
        this.loaded_images_id = new Array();
        this.non_loaded_images_id = new Array();
        this.fps = 24;
        this.current_image;
        this.running = false;
        this.forward = true;

        var loader = new Loader(this.canvas, 200, 5),
            that = this,
            xhr = new Array();

        var encode64 = function (inputStr){
           var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
           var outputStr = "";
           var i = 0;
           
           while (i<inputStr.length){
              var byte1 = inputStr.charCodeAt(i++) & 0xff;
              var byte2 = inputStr.charCodeAt(i++) & 0xff;
              var byte3 = inputStr.charCodeAt(i++) & 0xff;

              var enc1 = byte1 >> 2;
              var enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
              
              var enc3, enc4;
              if (isNaN(byte2)){
                enc3 = enc4 = 64;
              } else{
                enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
                if (isNaN(byte3)){
                   enc4 = 64;
                } else {
                    enc4 = byte3 & 63;
                }
              }
              outputStr +=  b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4);
           } 
           return outputStr;
        }
        

        var downloadImage = function (image_id){

            if (window.XMLHttpRequest || window.ActiveXObject) {
                if (window.ActiveXObject) {
                    try {
                        xhr[image_id] = new ActiveXObject("Msxml2.XMLHTTP");
                    } catch(exception) {
                        xhr[image_id] = new ActiveXObject("Microsoft.XMLHTTP");
                    }
                } else {
                  xhr[image_id] = new XMLHttpRequest(); 
                }
            } else {
                alert("Your browser does not support XMLHTTP Request...!");
            }


            // Requests sending
            xhr[image_id].open("GET", that.images_urls[image_id], true);
            xhr[image_id].overrideMimeType('text/plain; charset=x-user-defined');
            xhr[image_id].send(null);

            // Request Handler
            xhr[image_id].onreadystatechange = function() {
                
                
                if (xhr[image_id].readyState == 4){

                    // If we got the file 
                    if ((xhr[image_id].status == 200) || (xhr[image_id].status == 0)){

                        // Save it
                        that.images[image_id].src = "data:image/jpg;base64," + encode64(xhr[image_id].responseText);
                        that.loaded_images_id.push(image_id);


                    }else{
                        that.non_loaded_images_id.push(image_id);
                        alert("Something misconfiguration : " + 
                            "\nError Code : " + xhr[image_id].status + 
                            "\nError Message : " + xhr[image_id].responseText);
                    }

                    //Update loader
                    loader.setPercent(that.loaded_images_id.length / last_image_nb);

                    // if it is our last response
                    if (that.loaded_images_id.length + that.non_loaded_images_id.length === last_image_nb + 1) {

                        if (that.loaded_images_id.length === 0) {
                            alert("Aucune image n'a été téléchargée correctement.")
                        }else{

                            that.loaded_images_id.sort(function(a, b){
                                return a-b
                                });

                            that.current_image = that.loaded_images_id[0];

                            // Get canvas back to normal
                            loader.context.translate(-that.canvas.width / 2, -that.canvas.height / 2);
                            //Delete loader reference to make garbage collector delete it 
                            delete loader;
                            that.running = true;
                            that.run();

                            // Display control menu
                            document.getElementsByTagName("nav")[0].style.opacity = "1";
                            
                        };
                        
                    };


                }

            }; 
        }

        //We download images..
        for (var i = first_image_nb; i <= last_image_nb; i++) {
            this.images[i] = new Image();
            downloadImage(i);
        };

    }



    // Property to run the animation
    Slideshow.prototype.run = function() {
        var that = this;

        // I we are still running
        if(this.running){  
            setTimeout(function() {
                requestAnimationFrame(function(){
                    that.run();
                });

                that.canvas_context.drawImage(that.images[that.loaded_images_id[that.current_image]], 0, 0);
                // if we are running forward
                

                if(that.forward){
                    if (that.current_image < that.loaded_images_id.length-1) {
                        that.current_image++;
                    }else{
                        that.current_image = 0;
                    };
                    // if we are running backward
                }else{
                    if (that.current_image > 0) {
                        that.current_image--;
                    }else{
                        that.current_image = that.loaded_images_id.length-1;
                    };
                };

         }, 1000 / that.fps);
        }
    };



    // Property to reset the animation
    Slideshow.prototype.reset = function() {
        this.current_image = 0;
        this.canvas_context.drawImage(this.images[this.loaded_images_id[this.current_image]], 0, 0);
    };




    

    //*************************************** Instanciations ******************************************//


    // Creation of our slideshow
    var slideshow = new Slideshow(canvas, images_urls);










    //*************************************** Control button handlers ****************************************//



    // Play/Pause button listener
    document.getElementById("play_pause").addEventListener("click", function(){
        if (slideshow.running) {
            // Display running icon
            this.innerHTML = "&#xf04b;";
            slideshow.running = false;
        }else{
            // Display pause icon
            this.innerHTML = "&#xf04c;";
            slideshow.running = true;
            slideshow.run();
        }
    });

    // Stop button listener
    document.getElementById("stop").addEventListener("click", function(){
        if (slideshow.running) {
            // Display running icon
            document.getElementById("play_pause").innerHTML = "&#xf04b;";
            slideshow.running = false;
        }
        slideshow.reset();
    });

    // Change direction button listener
    document.getElementById("change_direction").addEventListener("click", function(){
        if (slideshow.forward) {
            //Display forward button
            this.innerHTML = "&#xf051;";
            slideshow.forward = false;
        }else{
            // Display backward button
            this.innerHTML = "&#xf048;";
            slideshow.forward = true;
        }
    });


};
