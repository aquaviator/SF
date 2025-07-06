"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
const Form = FormProvider
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)
const FormField = <
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  
  // Safely get form context
  let getFieldState, formState
  try {
    const formMethods = useFormContext()
    getFieldState = formMethods?.getFieldState
    formState = formMethods?.formState
  } catch (error) {
    // If no form context, return safe defaults
    return {
      id: React.useId(),
      name: '',
      formItemId: `fallback-form-item`,
      formDescriptionId: `fallback-form-item-description`,
      formMessageId: `fallback-form-item-message`,
      error: undefined,
      invalid: false,
      isDirty: false,
      isTouched: false,
    }
  }
  if (!fieldContext?.name || !getFieldState || !formState) {
    // Return safe defaults if context is incomplete
    const fallbackId = itemContext?.id || React.useId()
      id: fallbackId,
      name: fieldContext?.name || '',
      formItemId: `${fallbackId}-form-item`,
      formDescriptionId: `${fallbackId}-form-item-description`,
      formMessageId: `${fallbackId}-form-item-message`,
  const fieldState = getFieldState(fieldContext.name, formState)
  const { id } = itemContext || { id: React.useId() }
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
type FormItemContextValue = {
  id: string
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
})
FormItem.displayName = "FormItem"
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
  const { error, formItemId } = useFormField()
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
FormLabel.displayName = "FormLabel"
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
    <Slot
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
FormControl.displayName = "FormControl"
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
  const { formDescriptionId } = useFormField()
    <p
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
FormDescription.displayName = "FormDescription"
const FormMessage = React.forwardRef<
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children
  if (!body) {
    return null
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
    >
      {body}
    </p>
FormMessage.displayName = "FormMessage"
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
