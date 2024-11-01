import { SearchIcon, HamburgerIcon, ArrowBackIcon } from "@chakra-ui/icons"; // Import the back icon
import {
    Box,
    Button,
    Flex,
    IconButton,
    Input,
    Skeleton,
    SkeletonCircle,
    Text,
    useColorModeValue,
    Image,
    useColorMode,
} from "@chakra-ui/react";
import Conversation from "../components/Conversation";
import { GiConversation } from "react-icons/gi";
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";

const ChatPage = () => {
    const [searchingUser, setSearchingUser] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();
    const [showConversations, setShowConversations] = useState(true);
    const { colorMode } = useColorMode();

    useEffect(() => {
        socket?.on("messagesSeen", ({ conversationId }) => {
            setConversations((prev) => {
                const updatedConversations = prev.map((conversation) => {
                    if (conversation._id === conversationId) {
                        return {
                            ...conversation,
                            lastMessage: {
                                ...conversation.lastMessage,
                                seen: true,
                            },
                        };
                    }
                    return conversation;
                });
                return updatedConversations;
            });
        });
    }, [socket, setConversations]);

    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await fetch("/api/messages/conversations");
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                setConversations(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingConversations(false);
            }
        };

        getConversations();
    }, [showToast, setConversations]);

    const handleConversationSearch = async (e) => {
        e.preventDefault();
        setSearchingUser(true);
        try {
            const res = await fetch(`/api/users/profile/${searchText}`);
            const searchedUser = await res.json();
            if (searchedUser.error) {
                showToast("Error", searchedUser.error, "error");
                return;
            }

            const messagingYourself = searchedUser._id === currentUser._id;
            if (messagingYourself) {
                showToast("Error", "You cannot message yourself", "error");
                return;
            }

            const conversationAlreadyExists = conversations.find(
                (conversation) => conversation.participants[0]._id === searchedUser._id
            );

            if (conversationAlreadyExists) {
                setSelectedConversation({
                    _id: conversationAlreadyExists._id,
                    userId: searchedUser._id,
                    username: searchedUser.username,
                    userProfilePic: searchedUser.profilePic,
                });
                setShowConversations(false);
                return;
            }

            const mockConversation = {
                mock: true,
                lastMessage: {
                    text: "",
                    sender: "",
                },
                _id: Date.now(),
                participants: [
                    {
                        _id: searchedUser._id,
                        username: searchedUser.username,
                        profilePic: searchedUser.profilePic,
                    },
                ],
            };
            setConversations((prevConvs) => [...prevConvs, mockConversation]);
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setSearchingUser(false);
        }
    };

    const handleConversationClick = (conversation) => {
        setSelectedConversation({
            _id: conversation._id,
            userId: conversation.participants[0]._id,
            userProfilePic: conversation.participants[0].profilePic,
            username: conversation.participants[0].username,
            mock: conversation.mock,
        });
        setShowConversations(false);
    };

    const handleBackClick = () => {
        setSelectedConversation({}); // Clear the selected conversation
        setShowConversations(true); // Show conversations again
    };

    

    return (
        <Box
            position={"absolute"}
            left={"50%"}
            w={{ base: "100%", md: "80%", lg: "750px" }}
            p={4}
            transform={"translateX(-50%)"}
        >
            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                {selectedConversation._id && ( // Check if a conversation is selected
                    <IconButton
                        aria-label="Back to conversations"
                        icon={<ArrowBackIcon />}
                        onClick={handleBackClick}
                        mt={-10}
                    />
                )}
                <Flex alignItems="center" gap={2} mt={-10}>
                    <Input
                        placeholder="Search for a user"
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button size={"sm"} onClick={handleConversationSearch} isLoading={searchingUser}>
                        <SearchIcon />
                    </Button>
                </Flex>
            </Flex>

            <Flex
                gap={4}
                flexDirection={{ base: "column", md: "row" }}
                maxW={{ sm: "400px", md: "full" }}
                mx={"auto"}
            >
                {showConversations && (
                    <Flex
                        flex={30}
                        gap={2}
                        flexDirection={"column"}
                        maxW={{ sm: "250px", md: "full" }}
                        mx={"auto"}
                        ml={{ base: "-1", md: "0" }}
                        borderRadius={"lg"}
                        boxShadow={"md"}
                        p={4}
                    >
                        <Text fontWeight={700} fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
                            Your Conversations
                        </Text>

                        {loadingConversations &&
                            [0, 1, 2, 3, 4].map((_, i) => (
                                <Flex
                                    key={i}
                                    gap={4}
                                    alignItems={"center"}
                                    p={"1"}
                                    borderRadius={"md"}
                                    _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                                    transition="background 0.2s"
                                >
                                    <Box>
                                        <SkeletonCircle size={"10"} />
                                    </Box>
                                    <Flex w={"full"} flexDirection={"column"} gap={1}>
                                        <Skeleton h={"10px"} w={"80px"} />
                                        <Skeleton h={"8px"} w={"90%"} />
                                    </Flex>
                                </Flex>
                            ))}

                        {!loadingConversations &&
                            conversations.map((conversation) => (
                                <Flex
                                    key={conversation._id}
                                    alignItems={"center"}
                                    p={2}
                                    borderRadius={"md"}
                                    _hover={{ bg: useColorModeValue("gray.100", "gray.700"), cursor: "pointer" }}
                                    transition="background 0.2s"
                                    onClick={() => handleConversationClick(conversation)}
                                >
                                    <Box>
                                        <Image
                                            src={conversation.participants[0].profilePic} // Ensure this URL is valid
                                            alt={`${conversation.participants[0].username}'s profile`}
                                            borderRadius="full"
                                            boxSize="40px"
                                            objectFit="cover"
                                            fallbackSrc="path/to/default-avatar.png" // Provide a fallback image path
                                            onError={(e) => {
                                                e.target.onerror = null; // Prevent looping
                                                e.target.src = "path/to/default-avatar.png"; // Set fallback image
                                            }}
                                        />
                                    </Box>
                                    <Box ml={2}>
                                        <Text fontWeight={700}>{conversation.participants[0].username}</Text>
                                        <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.300")}>
                                            {conversation.lastMessage.text}
                                        </Text>
                                    </Box>
                                    {onlineUsers.includes(conversation.participants[0]._id) && (
                                        <Box
                                            bg="green.500"
                                            borderRadius="full"
                                            boxSize={3}
                                            ml={2}
                                            borderWidth={2}
                                            borderColor="white"
                                        />
                                    )}
                                </Flex>
                            ))}
                    </Flex>
                )}
                {/* Message Container */}
                {!showConversations && selectedConversation._id && (
                    <MessageContainer
               
                        selectedConversation={selectedConversation}
                        socket={socket}
                        setShowConversations={setShowConversations}
                    />
                )}
            </Flex>
        </Box>
    );
};

export default ChatPage;
