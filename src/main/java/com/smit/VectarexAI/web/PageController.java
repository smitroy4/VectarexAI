package com.smit.VectarexAI.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the HTML pages for the chat and summarize tools.
 *
 * These are @GetMapping methods (not addViewController) because /chat already
 * has POST and DELETE mappings in ChatController. Registering the GET route
 * here puts it in the same RequestMappingHandlerMapping, so the browser's
 * GET /chat is handled instead of falling through to a 405 Method Not Allowed.
 *
 * This is a @RestController NOT, so returning "forward:..." is treated as a
 * view name and forwarded internally to the static resource.
 */
@Controller
public class PageController {

    @GetMapping("/chat")
    public String chatPage() {
        return "forward:/chat.html";
    }

    @GetMapping("/summarize")
    public String summarizePage() {
        return "forward:/summarize.html";
    }
}
