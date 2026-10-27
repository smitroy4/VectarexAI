package com.smit.VectarexAI.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/chat")
    public Flux<String> chat(@RequestBody String message){
        return chatService.chat(message);
    }

    @DeleteMapping("/chat")
    public void clearChat(){
        chatService.clearHistory();
    }

}
