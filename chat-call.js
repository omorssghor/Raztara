/* =========================================================
   RAZTARA — CHAT CALL MODULE
   Incoming Call + Audio/Video Call
   ========================================================= */

let incomingCallChannel = null;
let incomingCallData = null;
let incomingCallBusy = false;


/* =========================
   START OUTGOING CALL
   ========================= */

async function startCall(type){

    if(!currentUser || !otherUserId) return;

    if(blocked){
        showToast(t("blockedCannotSend"));
        return;
    }

    if(!conversationId){
        showToast(t("callFailed"));
        return;
    }

    try{

        const { data, error } = await supabaseClient
            .from("calls")
            .insert({
                conversation_id: conversationId,
                caller_id: currentUser.id,
                receiver_id: otherUserId,
                call_type: type,
                status: "ringing"
            })
            .select("id")
            .single();

        if(error){

            console.error("Start call error:", error);

            showToast(
                error.message || t("callFailed")
            );

            return;
        }

        if(data?.id){

            window.location.href =
                "call.html?call=" +
                encodeURIComponent(data.id);

        }

    }catch(error){

        console.error("Start call exception:", error);

        showToast(
            error?.message || t("callFailed")
        );
    }
}


/* =========================
   SUBSCRIBE INCOMING CALLS
   ========================= */

function subscribeIncomingCalls(){

    if(!currentUser) return;

    if(incomingCallChannel){

        supabaseClient.removeChannel(
            incomingCallChannel
        );

        incomingCallChannel = null;
    }

    incomingCallChannel =
        supabaseClient
        .channel(
            "incoming-calls-" +
            currentUser.id +
            "-" +
            Date.now()
        )

        /* New incoming call */
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "calls",
                filter:
                    "receiver_id=eq." +
                    currentUser.id
            },
            payload => {

                handleIncomingCallRow(
                    payload?.new
                );

            }
        )

        /* Incoming call status changes */
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "calls",
                filter:
                    "receiver_id=eq." +
                    currentUser.id
            },
            payload => {

                const call = payload?.new;

                if(!call) return;

                if(
                    incomingCallData &&
                    incomingCallData.id === call.id
                ){

                    if(
                        call.status === "ended" ||
                        call.status === "rejected" ||
                        call.status === "cancelled"
                    ){

                        hideIncomingCall();

                    }

                }

            }
        )

        .subscribe(status => {

            console.log(
                "Incoming call realtime:",
                status
            );

        });
}


/* =========================
   HANDLE INCOMING CALL
   ========================= */

async function handleIncomingCallRow(call){

    if(!call) return;

    /* Only ringing calls */
    if(call.status !== "ringing") return;

    /* Never treat own call as incoming */
    if(
        call.caller_id === currentUser.id
    ) return;

    /* Already showing this call */
    if(
        incomingCallData &&
        incomingCallData.id === call.id
    ) return;

    /* Already showing another call */
    if(incomingCallData) return;


    /* =========================
       CHECK BLOCK
       ========================= */

    try{

        const { data: blockData } =
            await supabaseClient
            .from("blocked_users")
            .select("id")
            .eq(
                "blocker_id",
                currentUser.id
            )
            .eq(
                "blocked_id",
                call.caller_id
            )
            .maybeSingle();

        if(blockData) return;

    }catch(error){

        console.error(
            "Incoming call block check:",
            error
        );

    }


    incomingCallData = call;


    /* =========================
       DEFAULT CALLER INFO
       ========================= */

    let callerName =
        "RAZTARA User";

    let callerAvatar =
        "https://i.pravatar.cc/150?img=12";


    /* =========================
       LOAD CALLER PROFILE
       ========================= */

    try{

        const {
            data: callerProfile,
            error
        } = await supabaseClient
            .from("profiles")
            .select(`
                id,
                username,
                full_name,
                avatar_url
            `)
            .eq(
                "id",
                call.caller_id
            )
            .maybeSingle();


        if(!error && callerProfile){

            callerName =
                callerProfile.full_name ||
                callerProfile.username ||
                "RAZTARA User";


            if(callerProfile.avatar_url){

                callerAvatar =
                    callerProfile.avatar_url;

            }

        }

    }catch(error){

        console.error(
            "Caller profile error:",
            error
        );

    }


    /* =========================
       UPDATE INCOMING UI
       ========================= */

    const overlay =
        document.getElementById(
            "incomingCallOverlay"
        );

    const avatar =
        document.getElementById(
            "incomingCallAvatar"
        );

    const name =
        document.getElementById(
            "incomingCallName"
        );

    const type =
        document.getElementById(
            "incomingCallType"
        );


    if(avatar){

        avatar.src =
            callerAvatar;

    }


    if(name){

        name.textContent =
            callerName;

    }


    if(type){

        type.textContent =
            call.call_type === "video"
                ? "📹 Video Call"
                : "📞 Audio Call";

    }


    if(overlay){

        overlay.classList.add("show");

    }


    /* =========================
       VIBRATION
       ========================= */

    try{

        if(
            navigator.vibrate
        ){

            navigator.vibrate([
                300,
                200,
                300,
                200,
                500
            ]);

        }

    }catch(error){}

}


/* =========================
   ACCEPT INCOMING CALL
   ========================= */

async function acceptIncomingCall(){

    if(
        incomingCallBusy ||
        !incomingCallData
    ) return;


    incomingCallBusy = true;

    const call =
        incomingCallData;


    try{

        const { error } =
            await supabaseClient
            .from("calls")
            .update({

                status: "answered",

                answered_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                call.id
            )
            .eq(
                "receiver_id",
                currentUser.id
            )
            .eq(
                "status",
                "ringing"
            );


        if(error){

            console.error(
                "Accept call error:",
                error
            );

            showToast(
                error.message ||
                t("callFailed")
            );

            incomingCallBusy = false;

            return;
        }


        hideIncomingCall();


        /* Open actual call page */

        window.location.href =
            "call.html?call=" +
            encodeURIComponent(call.id);


    }catch(error){

        console.error(
            "Accept call exception:",
            error
        );

        showToast(
            error?.message ||
            t("callFailed")
        );

        incomingCallBusy = false;
    }
}


/* =========================
   REJECT INCOMING CALL
   ========================= */

async function rejectIncomingCall(){

    if(
        incomingCallBusy ||
        !incomingCallData
    ) return;


    incomingCallBusy = true;

    const call =
        incomingCallData;


    try{

        const { error } =
            await supabaseClient
            .from("calls")
            .update({

                status: "rejected",

                ended_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                call.id
            )
            .eq(
                "receiver_id",
                currentUser.id
            )
            .eq(
                "status",
                "ringing"
            );


        if(error){

            console.error(
                "Reject call error:",
                error
            );

            showToast(
                error.message ||
                t("callFailed")
            );

        }


        hideIncomingCall();


    }catch(error){

        console.error(
            "Reject call exception:",
            error
        );

        showToast(
            error?.message ||
            t("callFailed")
        );

        hideIncomingCall();
    }
}


/* =========================
   HIDE INCOMING CALL
   ========================= */

function hideIncomingCall(){

    const overlay =
        document.getElementById(
            "incomingCallOverlay"
        );


    if(overlay){

        overlay.classList.remove(
            "show"
        );

    }


    incomingCallData = null;

    incomingCallBusy = false;


    try{

        if(
            navigator.vibrate
        ){

            navigator.vibrate(0);

        }

    }catch(error){}
}


/* =========================
   CALL MODULE CLEANUP
   ========================= */

function cleanupIncomingCall(){

    if(incomingCallChannel){

        supabaseClient.removeChannel(
            incomingCallChannel
        );

        incomingCallChannel = null;

    }

    hideIncomingCall();
}
