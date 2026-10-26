package com.smit.VectarexAI;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api")
public class SummarizeController {

    @Autowired
    private SummarizeService summarizeService;

    @PostMapping("/summarize")
    public String summarize(@RequestBody String ticket) {
        return summarizeService.summarize(ticket);
    }
}
