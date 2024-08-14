'use client'

import { Button } from "@/components/ui/button"
import { useChat } from "ai/react"
import { useRef, useEffect } from 'react'
import { AuroraBackground } from "../../components/ui/aurora-background"
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

export function Chat() {
    const { messages, input, 
        handleInputChange, 
        handleSubmit } = useChat({
            api: 'api/chat',
            onError: (e) => console.log(e),
    });
    const chatParent = useRef<HTMLUListElement>(null)

    useEffect(() => {
        const domNode = chatParent.current
        if (domNode) {
            domNode.scrollTop = domNode.scrollHeight
        }
    })

    console.log(messages);

    return (
        <AuroraBackground className="bg-slate-950">
            <motion.div
                initial={{ opacity: 0.0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
                }}
                className="relative flex flex-col gap-4 items-center justify-center px-4"
            >

            <main className="flex flex-col pt-10 w-screen h-screen max-h-dvh">
                <section className="container bg-slate-800 bg-opacity-20 px-0 rounded-lg pt-5 flex flex-col flex-grow gap-4 mx-auto max-w-3xl border-2 border-black">
                    <ul ref={chatParent} className="h-1 p-4 flex-grow bg-muted/50 rounded-lg overflow-y-auto flex flex-col gap-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-300 p-4 border-b-2 border-black">Volvo S90 Customer Support</h1>
                        <div className="p-1"></div>
                        {messages.map((m, index) => (
                            <>
                                {m.role === 'user' ? (
                                    <li key={index} className="flex  flex-row-reverse">
                                        <div className="rounded-xl p-4 shadow-md flex bg-slate-800 bg-opacity-50">
                                            <p className="text-white text-primary">{m.content}</p>
                                        </div>
                                    </li>
                                ) : (
                                    <li key={index} className="flex flex-row">
                                        <div className="rounded-xl p-4 bg-background shadow-md flex bg-slate-950 bg-opacity-40">
                                            <p className=" text-slate-300 text-primary">
                                            <span className="font-bold">Answer: </span>
                                            <ReactMarkdown>
                                            {m.content}
                                            </ReactMarkdown>
                                            </p>
                                        </div>
                                    </li>
                                )}
                            </>
                            
                        ))}
                    </ul >
                </section>

                <section className="p-4 pb-20">
                    <form onSubmit={handleSubmit} className="flex w-full max-w-3xl  mx-auto items-center">
                        <input className="flex-1 min-h-[50px] rounded-md p-2 pl-4 focus:border-slate-300 focus:border-4 focus:ring-0 focus:outline-none border-black text-white bg-opacity-40 bg-slate-600" placeholder="Type your question here..." type="text" value={input} onChange={handleInputChange} />
                        <Button className=" text-slate-200 hover:bg-slate-500 font-extrabold border-2 border-black bg-slate-600 opacity-70 ml-2 min-h-[50px]" type="submit">
                            Send
                        </Button>
                    </form>
                </section>
            </main>
            </motion.div>
        </AuroraBackground>
    )
}
