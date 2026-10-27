package com.smit.VectarexAI.summarize;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SummarizeService {

    private final ChatClient chatClient;

    public SummarizeService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String summarize(String ticket) {
        log.info("Called - openai/gpt-oss-120b API");
        return chatClient.prompt()
                .user("Summarize in 2 lines : \n\n" + ticket)
                .call()
                .content();
    }
}
