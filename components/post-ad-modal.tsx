"use client";

import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/react";
import { User } from "@supabase/supabase-js";

import { PlusIcon } from "./icons";
import PostAdForm from "./form/PostAdForm";

interface PostAdModalProps {
  user: User;
}

const PostAdModal = ({ user }: PostAdModalProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        isIconOnly
        aria-label="Login"
        radius="full"
        variant="light"
        onPress={onOpen}
      >
        <PlusIcon />
      </Button>
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalBody>
            <PostAdForm user={user} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PostAdModal;
