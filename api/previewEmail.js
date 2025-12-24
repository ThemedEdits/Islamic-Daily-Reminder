import handler from "./sendEmails.js";

export default async function preview(req, res) {
    // Fake one subscriber preview
    req.method = "GET";

    // Monkey-patch Firestore query result
    const originalFirestore = global.admin?.firestore;

    global.admin.firestore = () => ({
        collection: () => ({
            where: () => ({
                get: async () => ({
                    size: 1,
                    docs: [
                        {
                            data: () => ({
                                email: req.query.email || process.env.GMAIL_USER,
                                active: true,
                                language: req.query.lang || "en"
                            })
                        }
                    ]
                })
            })
        })
    });

    await handler(req, res);

    // Restore Firestore
    global.admin.firestore = originalFirestore;
}
