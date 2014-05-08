

// Setup the back button warning:


window.onbeforeunload = function() {
    return 'Hitting the back button will break this experiment, and is disabled, hit cancel';
}

// how much time do they get total? I Think 15? 
var TIME_LIMIT_IN_MINUTES = 10;
var INTERVAL_IN_SECONDS_OF_HOW_OFTEN_TO_SHOW_OTHER_STUDENT_ACTIONS = 60; // one minute
var TIMEOUT_FOR_OTHER_PARTICIPANTS = 15*1000;
var NUMBER_OF_ROUNDS = 6;


window.participant_id = undefined;
window.group_id       = undefined;
window.round_number = 1;

$(document).ready(function() {
    
    // 1) Collect Group and Participant ID
    $(".participant").modal({
        close:false,
		overlayId: 'simplemodal-overlay',
		containerId: 'simplemodal-container',         
        onShow: function (dialog) {
			var modal = this;
            $(".participant").show();
            
            //accept enter
            $('.participant input').keyup(function(event) {
                if (event.keyCode == '13') {
                    $('.participant .button').click();
                }
            });
            
			// if the user clicks "yes"
			$('.participant .button').click(function () {
			    // clear error message
                $('.participant .error').html("");
                
				// close the dialog
                window.participant_id = $('.participant #participant_id').val();
                window.group_id = $('.participant #group_id').val();

                if(window.participant_id && window.group_id && window.group_id.match(/^\d\d*$/) 
                    && window.participant_id.match(/^\d\d*$/)) {
                        
				    modal.close();
				    // move on to the next step..
                    
                    
                    // HACK: setTimeout because we can only have one modal dialog 
                    //       at a time
                    setTimeout(function(){
                        window.show_instructions();
                    },10);
				    
				    
                }else {
                    var error = "You must enter a valid group id and participant id"
                    $('.participant .error').html(error);
                    if(window.console){
                        window.console.error(error)
                    }
                }
			});
		}
    });
    
    // Add instructions
    window.show_instructions= function() {
        var timer_started = false;
        $(".round").html("Round " + window.round_number);
        $('.instructions').modal({
            close:true,
            overlayClose:true,
    		overlayId: 'instructions-overlay',
    		containerId: 'instructions-container',
    		onClose: function(){
    		    if(!timer_started){
    		        window.start_timer();
    		        timer_started=true;
    		        
    		        $(".content").show()
    		        // click on first essay
    		        $($(".essay_link")[0]).click();
    		        
    		    }
    		    this.close();
    		},
    		onShow:function(){
                var modal = this;
                
                $("#instructions-container").click(function(){
        		    if(!timer_started){
        		        window.start_timer();
        		        timer_started=true;
        		        
        		        $(".content").show()
    		            // click on first essay
    		            $($(".essay_link")[0]).click();

        		    }
        		    modal.close();
        		    closed = true;    		        
    		    })

    		}         
        });
    }

    $(".show_instructions").click(function(event){
        event.stopPropagation();
        
        show_instructions();
        return false;
    });

    $(".quit").click(function(event){
        event.stopPropagation();

        $('.confirm_quit').modal({
            close:true,
            overlayClose:true,
    		overlayId: 'quit-overlay',
    		containerId: 'quit-container',
    		onShow:function(){
                var modal = this;
                $(".confirm_quit .quit_button").click(function(){
        		    modal.close();
        		    
                    if(round_number <= NUMBER_OF_ROUNDS){
                      update_round() 
                      setTimeout(function(){ window.quit()}, 10);                         
                    } else{
        		      // let it close the modal, and open a new one
        		      setTimeout(function(){ window.quit()}, 10);
                    }   		        
    		    })
                $(".confirm_quit .cancel_button").click(function(){
                    modal.close();
    		    })
    		}         
        });


        
        return false;
    });
    
    window.quit = function(kwargs){
        // make sure whatever is open is now closed
        $.modal.close();
        
        if(kwargs && kwargs.timeout){
            //MAKE IT SO WHEN IT TIMES OUT IT CHECKS WHAT ROUND IT IS ON AND DOES THE RIghT ThinG
            if(window.round_number < NUMBER_OF_ROUNDS){
                window.stop_timer();
                update_round();
                var msg = "";
                msg = "This round has timed out, your next round starts now!";
                $(".score_card .msg").html(msg);    
                window.score_card_modal();
            } else {
                window.stop_timer();
                var msg = "";
                msg = "You ran out of time, but at least it's over :-)";
                $(".finished .msg").html(msg);    
                // remove unload handler so we can reset things easily
                window.onbeforeunload = undefined;
                window.finished_modal();
            }

        } else if(window.round_number <= NUMBER_OF_ROUNDS){
            window.score_card_modal()

        } else {
            // stop the timer
            window.stop_timer();
            // remove unload handler so we can reset things easily
            window.onbeforeunload = undefined;
            window.finished_modal();
        }
    };

    window.finished_modal = function finished_modal(){
        // basically 'callLater' something about these dialogs
        setTimeout(function(){
            $(".finished").modal({
                close:false,
                overlayClose:false,
                overlayId: 'quit-overlay',
                containerId: 'quit-container',
                onShow:function(){
                    // Hack to steal the time from the timer. 
                    var time = $(".timer").html();
                    // TODO: k you may need to change the url to the score_card
                    // Do an ajax request to get the body we are looking for
                    $.get( window.path_to_controller + '/score_card', { participant_id: window.participant_id,
                                                                        round_number: window.round_number } ,function(data) {
                        $('.finished .body').html(data);
                    });   
                    //Send the time to the backend
                    $.ajax({
                        type: 'POST',
                        url: "users/complete",
                        data: {
                            "participant_id": window.participant_id,
                            "time_to_complete" : time
                            }
                    });
                }         
            }) 
        },10)
    };

    window.score_card_modal = function score_card_modal(){
        // basically 'callLater' something about these dialogs
        setTimeout(function(){
            $(".score_card").modal({
                close:false,
                overlayClose:false,
                overlayId: 'quit-overlay',
                containerId: 'quit-container',
                onShow:function(){
                    // Hack to steal the time from the timer. 
                    var time = $(".timer").html();
                    var modal = this;
                    // TODO: k you may need to change the url to the score_card
                    // Do an ajax request to get the body we are looking for
                    $.get( window.path_to_controller + '/score_card', { participant_id: window.participant_id,
                                                                        round_number: window.round_number } ,function(data) {
                        $('.score_card .body').html(data);
                    });  

                    $(".done .done_button").click(function(){
                        modal.close();
                    });
                }         
            });      
        },10);
    };
    
    
    
    window.show_other_student_actions = function(){
        // stops the timer and shows what other students are up to
        // basically overlays a model dialog and we work from there
        window.stop_timer();

        // make sure whatever is open is now closed
        $.modal.close();
        var closed = false;          
        
        $(".other_participants").modal({
            close:true,
            overlayClose:true,
    		overlayId: 'quit-overlay',
    		containerId: 'quit-container',
    		onShow:function(){
    		    var modal = this;
    		    
    		    // TODO: Russell you may need to change the url to the stats
                // Do an ajax request to get the body we are looking for
                $.get( '/users/stats?group=' + window.group_id, function(data) {
                    $('.other_participants .body').html(data);
                });                 

                $(".other_participants .button").click(function(){
                    modal.close();
                    closed = true;
                    window.start_timer();
                })               
  		    
    		    setTimeout(function(){
        		    if(!closed) {
        		        modal.close();
    		        }
    		        
    		    }, TIMEOUT_FOR_OTHER_PARTICIPANTS);
    		    
    		},
    		onClose:function(){
    		    this.close();
    		    window.start_timer();
    		}         
        });
        
    };

    // TODO: don't start the timer until they have finished the practice test
    
    
    
    //TODO: have a way to do the handler
    
    
    // add click handlers for all the individual essays
    var cached_essays = {}
    $('.essay_link').click(function(event){
       event.stopPropagation();
       
       var essay_number = $(this).attr('rel');
       var essay_id     = "#essay_" + essay_number;
       
       $('.essay_link').each(function(){
          this.className ="essay_link" 
       });
       
       // when clicked give it selected_link
       this.className = "essay_link selected_link";
       
       // hide all content
       $('.content').hide()
       $(".essay_content").hide();
       
       if(cached_essays[essay_id]){
           $(essay_id).show();
           $('.content').show()
           window.essay_id=essay_id;
       
       }else {
           $.get('/essay_base/show/' + essay_number, function(data) {
               $('.content').append(data);
               cached_essays[essay_id] = true;
           
               // process the div
               attach_event_handlers_to_essay(essay_id);
               
               window.essay_id=essay_id; 
               $(essay_id).show();
               $('.content').show()
           }); 
       } 
    });
    
    function generate_box(span) {
        var is_quota = (span.className.match(/quota/i) != null) ? true : false;

        if(is_quota && window.__show_quota_items){
            span.className = "correctme unmodified_quota";
        }
        else{
            span.className = "correctme unmodified";
        }

        
        var original_text = $(span).html();
        
        //clear it
        $(span).html("");

        var input = document.createElement("input")
        input.type     = "text";
        input.value    = original_text;
        input.size     = input.value.length*1.2;
        
        var correct_answer = span.getAttribute('rel');
        
        input.state = function() {
            /*
                Given a span like:
                <span class='correctme' rel='correct string'>original string</span>
                
                Tells us whether the string modified by the user is
                - correct
                - modified, but reverted to the original
                - no change (un touched at all by the user)
                - modifies, and returns difference
            */
            var current_value = input.value;
            
            if(input.modified) {
                if(current_value == correct_answer) {
                    return { status: "correct",  msg: correct_answer, style_class: "state_correct" }
                }
                else if(current_value == original_text) {
                    return {status: "incorrect - reverted to original", msg: "modified but returned to normal", style_class: "state_reverted"}
                }
                else {
                    // find the differnce between original and difference
                    // using the diffString Algorithm
                    var difference = diffString(original_text, current_value);
                    
                    // modified, return difference
                    return {status: "incorrect - modified", msg: difference, style_class: "state_modified"} 
                }
                
            }else {
                return { status: "incorrect - no change", msg: current_value, style_class: "state_no_change"};
            }
        }
        
        var change_function = function() {
            
            // remember that the field was modified
            input.modified = true;
            
            // timeout 10ms so we can read the input value for changes
            setTimeout(function() {
                if(is_quota &&  window.__show_quota_items){
                    span.className = "correctme modified_quota";
                }else{
                    span.className = "correctme modified";
                }
                
                if(input.value == original_text) {
                    if(is_quota &&  window.__show_quota_items){
                        span.className = "correctme unmodified_quota";
                    }else{
                        span.className = "correctme unmodified";
                    }
                }                        
                
            },10);
        }

        // handle change events
        input.onkeyup   = change_function;
        input.onchange  = change_function;
        
        // Save changes with  window.send_correction
        $(input).change(function(){
            var field_id = span.id;
            var current_value = input.value;
            // correct_answer
            var original_value = original_text;
            var essay = window.essay_id;
            //is_quota
            var round_number = window.round_number;

            window.send_correction(
                window.group_id,
                window.participant_id,
                window.essay_id,
                field_id,
                original_value,
                current_value,
                correct_answer,
                is_quota,
                round_number
                );            
        });
        
        
        span.appendChild(input);
        
    }
    
    
    // given an essay ID attach all the correct event handlers
    function attach_event_handlers_to_essay(essay_id){

        // generate boxes
        $(essay_id + " span.correctme").each(function(){
            generate_box(this);
        }); 
    }
     
    
    // timer related functions and variables
    var timer = null;
    var seconds = 0;
    window.start_timer = function(){
        window.stop_timer();

        timer = setInterval(function(){
            seconds +=1;
            
            var minutes_to_render =  TIME_LIMIT_IN_MINUTES - parseInt(seconds / 60) - 1
            var seconds_to_render = 60 - parseInt(seconds % 60)
            
            var spacer = '0';
            
            if(seconds_to_render>9){
                spacer = ''
            }
            
            // render the seconds
            $(".timer").html(minutes_to_render + ":" + spacer + seconds_to_render);
            
            // show other student scores
            if(seconds % INTERVAL_IN_SECONDS_OF_HOW_OFTEN_TO_SHOW_OTHER_STUDENT_ACTIONS == 0 && window.__show_other_student_actions){
                window.stop_timer();
                window.show_other_student_actions();
            }
        
        
            if(seconds == TIME_LIMIT_IN_MINUTES * 60){
                window.stop_timer();
                window.quit({'timeout' : true});
            }
        
        },1000);
        
    };
    
    window.stop_timer = function(){
        if(timer){
            clearInterval(timer)
        }
    };
    
    window.update_round = function update_round(){
        //update round number
        window.round_number++;
        $(".round").html("Round " + window.round_number);
        //clear cache
        cached_essays = {};
        $('.content').html("");
        console.log("Reseting Essays", cached_essays);
        $($(".essay_link")[0]).click();
        seconds = 0;
        window.start_timer();
    };
    
  // Handler for .ready() called.
});
