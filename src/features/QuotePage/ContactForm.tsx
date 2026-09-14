"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { Button, Input, Label, TextField } from "@heroui/react"

import {
  CONTACT_EMAIL_PATTERN,
  CONTACT_TEXT_MAX_LENGTH,
} from "@/shared/constants/cart.constants"
import {
  isValidContactEmail,
  isValidContactName,
} from "@/shared/utils/contact-validation.utils"
import type { CartContact } from "@/shared/types/global.types"

interface ContactFormProps {
  defaultValues: Partial<CartContact>
  onSubmitValid: (contact: CartContact) => void
  onCancel?: () => void
}

const FIRST_NAME_ERROR = "Escribe tu nombre."
const LAST_NAME_ERROR = "Escribe tus apellidos."
const EMAIL_ERROR = "Escribe un correo válido."

export const ContactForm = ({
  defaultValues,
  onSubmitValid,
  onCancel,
}: ContactFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CartContact>({ mode: "onChange", defaultValues })

  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  const { ref: firstNameRef, ...firstNameField } = register("firstName", {
    required: FIRST_NAME_ERROR,
    maxLength: {
      value: CONTACT_TEXT_MAX_LENGTH,
      message: FIRST_NAME_ERROR,
    },
    validate: (value) => isValidContactName(value) || FIRST_NAME_ERROR,
  })

  const lastNameField = register("lastName", {
    required: LAST_NAME_ERROR,
    maxLength: {
      value: CONTACT_TEXT_MAX_LENGTH,
      message: LAST_NAME_ERROR,
    },
    validate: (value) => isValidContactName(value) || LAST_NAME_ERROR,
  })

  const emailField = register("email", {
    required: EMAIL_ERROR,
    maxLength: {
      value: CONTACT_TEXT_MAX_LENGTH,
      message: EMAIL_ERROR,
    },
    pattern: { value: CONTACT_EMAIL_PATTERN, message: EMAIL_ERROR },
    validate: (value) => isValidContactEmail(value) || EMAIL_ERROR,
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => onSubmitValid(values))}
      noValidate
    >
      <TextField
        isInvalid={!!errors.firstName}
        defaultValue={defaultValues.firstName}
      >
        <Label>Nombre</Label>
        <Input
          {...firstNameField}
          ref={(node) => {
            firstNameRef(node)
            firstFieldRef.current = node
          }}
          aria-invalid={errors.firstName ? "true" : undefined}
          aria-describedby={
            errors.firstName ? "firstName-error" : undefined
          }
        />
        {errors.firstName && (
          <p role="alert" id="firstName-error" className="text-sm text-danger-600">
            {errors.firstName.message}
          </p>
        )}
      </TextField>

      <TextField
        isInvalid={!!errors.lastName}
        defaultValue={defaultValues.lastName}
      >
        <Label>Apellidos</Label>
        <Input
          {...lastNameField}
          aria-invalid={errors.lastName ? "true" : undefined}
          aria-describedby={errors.lastName ? "lastName-error" : undefined}
        />
        {errors.lastName && (
          <p role="alert" id="lastName-error" className="text-sm text-danger-600">
            {errors.lastName.message}
          </p>
        )}
      </TextField>

      <TextField isInvalid={!!errors.email} defaultValue={defaultValues.email}>
        <Label>Correo</Label>
        <Input
          type="email"
          {...emailField}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p role="alert" id="email-error" className="text-sm text-danger-600">
            {errors.email.message}
          </p>
        )}
      </TextField>

      <div className="flex items-center gap-3">
        <Button type="submit" isDisabled={!isValid}>
          Guardar datos
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onPress={onCancel}>
            Cancelar cambios
          </Button>
        )}
      </div>
    </form>
  )
}
