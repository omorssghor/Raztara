const CACHE_NAME = "raztara-v20261002-3";

const APP_SHELL = [
    "./",
    "./index.html",
    "./app.html",
    "./profile.html",
    "./chat.html",
    "./call.html",
    "./manifest.json"
];

/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_SHELL);
        })
    );

});


/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))

            );

        }).then(() => {

            return self.clients.claim();

        })

    );

});


/* =========================
   PUSH NOTIFICATION
========================= */

self.addEventListener("push", event => {

    if (!event.data) return;

    let data;

    try {

        data = event.data.json();

    } catch {

        data = {
            title: "RAZTARA",
            body: event.data.text()
        };

    }


    const title =
        data.title ||
        "RAZTARA";


    const options = {

        body:
            data.body ||
            "আপনার জন্য একটি কল এসেছে।",

        icon:
            data.icon ||
            "./icon-192.png",

        badge:
            "./icon-192.png",

        vibrate: [
            200,
            100,
            200,
            100,
            400
        ],

        tag:
            data.tag ||
            "raztara-call",

        renotify: true,

        requireInteraction: true,

        data: {

            callId:
                data.callId || null,

            callType:
                data.callType || "audio",

            url:
                data.url ||
                "./call.html"

        }

    };


    event.waitUntil(

        self.registration.showNotification(
            title,
            options
        )

    );

});


/* =========================
   NOTIFICATION CLICK
========================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const data =
            event.notification.data || {};

        const callId =
            data.callId;

        let url =
            data.url ||
            "./call.html";


        if (callId) {

            url =
                "./call.html?call=" +
                encodeURIComponent(callId);

        }


        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(clientList => {

                for (const client of clientList) {

                    if ("focus" in client) {

                        client.navigate(
                            new URL(
                                url,
                                self.location.origin
                            ).href
                        );

                        return client.focus();

                    }

                }


                if (clients.openWindow) {

                    return clients.openWindow(
                        new URL(
                            url,
                            self.location.origin
                        ).href
                    );

                }

            })

        );

    }
);


/* =========================
   NORMAL FILE CACHE
========================= */

self.addEventListener("fetch", event => {

    const request = event.request;


    if (
        request.url.includes("supabase.co") ||
        request.url.includes("/rest/") ||
        request.url.includes("/auth/")
    ) {

        return;

    }


    if (
        request.mode === "navigate" ||
        request.destination === "document"
    ) {

        event.respondWith(

            fetch(
                request,
                {
                    cache: "no-store"
                }
            )

            .then(response => {

                const copy =
                    response.clone();

                caches.open(
                    CACHE_NAME
                ).then(cache => {

                    cache.put(
                        request,
                        copy
                    );

                });

                return response;

            })

            .catch(() => {

                return caches.match(
                    request
                );

            })

        );

        return;

    }


    event.respondWith(

        caches.match(request)
            .then(cached => {

                return cached ||
                    fetch(request);

            })

    );

});
