import React, { useEffect, useRef } from "react";
import { List, Avatar } from "antd";
import { RobotOutlined, UserOutlined } from "@ant-design/icons";

interface Message {
  text: string;
  sender: string;
}

const ChatList = ({ promptMessages }: { promptMessages: any[] }) => {
  const listWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listWrapperRef.current) {
      listWrapperRef.current.scrollTop = listWrapperRef.current.scrollHeight;
    }
  }, [promptMessages]);

  return (
    <div className="chat-list-wrapper" ref={listWrapperRef}>
      <List
        dataSource={promptMessages.slice(1).map((message) => ({
          text: JSON.parse(message.content).move,
          sender:
            message.role === "assistant"
              ? "Opponent"
              : message.role === "user"
              ? "Me"
              : "undefined",
        }))}
        renderItem={(item: Message) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={
                    item.sender === "Opponent" ? (
                      <RobotOutlined />
                    ) : (
                      <UserOutlined />
                    )
                  }
                />
              }
              title={item.sender}
              description={item.text}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default ChatList;
