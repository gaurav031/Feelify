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
	const bgColor = useColorModeValue("gray.50", "gray.800");
	const selectedBgColor = useColorModeValue("blue.100", "blue.700");
	const hoverBgColor = useColorModeValue("gray.100", "gray.700");

	return (
		<Flex
			gap={3}
			alignItems="center"
			p={3}
			borderRadius="lg"
			w="full"
			bg={selectedConversation?._id === conversation._id ? selectedBgColor : bgColor}
			_hover={{
				cursor: "pointer",
				bg: hoverBgColor,
				transition: "background-color 0.3s ease",
			}}
			boxShadow={selectedConversation?._id === conversation._id ? "md" : "sm"}
			onClick={() => onClick(conversation)}
		>
			<WrapItem>
				<Avatar size="lg" src={user.profilePic}>
					{isOnline && <AvatarBadge boxSize="1em" bg="green.500" />}
				</Avatar>
			</WrapItem>

			<Stack direction="column" fontSize={{ base: "sm", md: "md" }} spacing={0.5}>
				<Text
					fontWeight="bold"
					color={useColorModeValue("gray.900", "gray.100")}
					display="flex"
					alignItems="center"
				>
					{user.username} <Image src="/verified.png" w={4} h={4} ml={1} />
				</Text>
				<Text
					fontSize="xs"
					color={useColorModeValue("gray.600", "gray.300")}
					display="flex"
					alignItems="center"
					gap={1}
				>
					{currentUser._id === lastMessage.sender && (
						<Box color={lastMessage.seen ? "blue.400" : "gray.500"}>
							<BsCheck2All size={16} />
						</Box>
					)}
					{lastMessage.text.length > 20
						? lastMessage.text.substring(0, 20) + "..."
						: lastMessage.text || <BsFillImageFill size={16} />}
				</Text>
			</Stack>
		</Flex>
	);
};

export default Conversation;
