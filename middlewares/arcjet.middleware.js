import { aj } from "../config/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetMiddleware = async (req, res, next) => {
    
    
   const decision = await aj.protect(req, {
    requested: 1
});
     console.dir(decision, { depth: null });
    

    if (decision.isDenied()) {

        if (decision.reason.isRateLimit()) {
            return res.status(429).json({
                message: "Too many requests.",
                success: false
            });
        }

        if (decision.reason.isBot()) {
            return res.status(403).json({
                message: "Bots are not allowed.",
                success: false
            });
        }

        return res.status(403).json({
            message: "Forbidden.",
            success: false
        });
    }

    if (decision.ip.isHosting()) {
        return res.status(403).json({
            message: "Hosting IPs are not allowed.",
            success: false

        });
    }

    if (decision.results.some(isSpoofedBot)) {
        return res.status(403).json({
            message: "Spoofed bot detected.",
            success: false
        });
    }

    next();
};

export default arcjetMiddleware;