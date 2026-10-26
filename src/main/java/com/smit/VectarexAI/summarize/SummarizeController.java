package com.smit.VectarexAI.summarize;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class SummarizeController {

    private final SummarizeService summarizeService;

    @PostMapping("/summarize")
    public String summarize(@RequestBody String ticket) {
        return summarizeService.summarize(ticket);
    }
}
