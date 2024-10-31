import {
	Avatar,
	AvatarBadge,
	Box,
	Flex,
	Image,
	Stack,
	Text,
	WrapItem,
	useColorMode,
	useColorModeValue,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All, BsFillImageFill } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const Conversation = ({ conversation, isOnline, onClick }) => {
	const user = conversation.participants[0];
	const currentUser = useRecoilValue(userAtom);
	const lastMessage = conversation.lastMessage;
	const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
	const colorMode = useColorMode();

	return (
		<Flex
			gap={4}
			alignItems={"center"}
			p={"1"}
			_hover={{
				cursor: "pointer",
				bg: useColorModeValue("gray.200", "gray.700"),
				color: "white",
			}}
			bg={
				selectedConversation?._id === conversation._id
					? useColorModeValue("gray.400", "gray.600")
					: "transparent"
			}
			borderRadius={"md"}
			w="full"
			onClick={() => onClick(conversation)} // Call the onClick function
		>
			<WrapItem>
				<Avatar
					size={{ base: "md", sm: "lg" }}
					src={user.profilePic}
				>
					{isOnline && <AvatarBadge boxSize='1em' bg='green.500' />}
				</Avatar>
			</WrapItem>

			<Stack direction={"column"} fontSize={{ base: "sm", md: "md" }}>
				<Text fontWeight='700' display={"flex"} alignItems={"center"}>
					{user.username} <Image src='/verified.png' w={4} h={4} ml={1} />
				</Text>
				<Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
					{currentUser._id === lastMessage.sender && (
						<Box color={lastMessage.seen ? "blue.400" : ""}>
							<BsCheck2All size={16} />
						</Box>
					)}
					{lastMessage.text.length > 18
						? lastMessage.text.substring(0, 18) + "..."
						: lastMessage.text || <BsFillImageFill size={16} />}
				</Text>
			</Stack>
		</Flex>
	);
};

export default Conversation;
