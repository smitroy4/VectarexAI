package com.smit.VectarexAI.websiteBuilder;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/website")
public class WebsiteBuilderController {

    private final WebsiteBuilderService websiteService;
    
    @PostMapping
    public String generateWebsite(@RequestBody String message) {
        return websiteService.generate(message);
    }

}

