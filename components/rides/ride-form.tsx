"use client"

/**
 * Ride Form Component - Phase 3.3.3 + 3.3.4
 * 
 * Single-page form for creating and editing rides.
 * Handles validation, state management, and submission.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { RideType, RideDifficulty, CreateRideRequest, RideDetail } from '@/lib/types/rides'

interface RideFormProps {
  clubId: string
  canPublish: boolean
  onSubmit: (data: CreateRideRequest) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  initialData?: RideDetail // NEW: For edit mode
  mode?: 'create' | 'edit' // NEW: Form mode
}

interface FormData {
  title: string
  description?: string
  startDate: string
  startTime: string
  maxParticipants?: number
  meetingPoint: {
    name: string
    address: string
    instructions?: string
  }
  route?: {
    name?: string
    distance?: number
    notes?: string
  }
}

export function RideForm({ 
  clubId, 
  canPublish, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  initialData,
  mode = 'create'
}: RideFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: mode === 'edit' && initialData ? {
      title: initialData.title,
      description: initialData.description,
      startDate: initialData.startDateTime.split('T')[0],
      startTime: initialData.startDateTime.split('T')[1].substring(0, 5),
      maxParticipants: initialData.maxParticipants,
      meetingPoint: {
        name: initialData.meetingPoint.name,
        address: initialData.meetingPoint.address,
        instructions: initialData.meetingPoint.instructions,
      },
      route: initialData.route ? {
        name: initialData.route.name,
        distance: initialData.route.distance ? initialData.route.distance / 1000 : undefined, // Convert meters to km
        notes: initialData.route.notes,
      } : undefined,
    } : undefined,
  })

  const [rideType, setRideType] = useState<RideType>(
    mode === 'edit' && initialData ? initialData.rideType : RideType.TRAINING
  )
  const [difficulty, setDifficulty] = useState<RideDifficulty>(
    mode === 'edit' && initialData ? initialData.difficulty : RideDifficulty.INTERMEDIATE
  )
  const [publishImmediately, setPublishImmediately] = useState(false)
  
  // Duration state (hours and minutes)
  const initialDuration = mode === 'edit' && initialData ? initialData.estimatedDuration : 120
  const [durationHours, setDurationHours] = useState(Math.floor(initialDuration / 60))
  const [durationMinutes, setDurationMinutes] = useState(initialDuration % 60)

  const handleFormSubmit = async (data: FormData) => {
    // Combine date and time into ISO 8601 string
    const startDateTime = `${data.startDate}T${data.startTime}:00.000Z`
    
    // Calculate total duration in minutes
    const totalDuration = (durationHours * 60) + durationMinutes
    
    // Build the create ride request
    const submitData: CreateRideRequest = {
      title: data.title,
      description: data.description || '',
      rideType,
      difficulty,
      startDateTime,
      estimatedDuration: totalDuration,
      maxParticipants: data.maxParticipants,
      publishImmediately: canPublish ? publishImmediately : false,
      meetingPoint: {
        name: data.meetingPoint.name,
        address: data.meetingPoint.address,
        instructions: data.meetingPoint.instructions,
      },
    }
    
    // Add route if provided
    if (data.route?.name) {
      submitData.route = {
        name: data.route.name,
        type: 'basic',
        distance: data.route.distance ? data.route.distance * 1000 : undefined, // Convert km to meters
        difficulty,
        notes: data.route.notes,
      }
    }
    
    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Ride Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Saturday Morning Training Ride"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 1, message: 'Title must be at least 1 character' },
                maxLength: { value: 100, message: 'Title must be less than 100 characters' },
              })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rideType">Ride Type</Label>
              <Select value={rideType} onValueChange={(value) => setRideType(value as RideType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RideType.TRAINING}>Training</SelectItem>
                  <SelectItem value={RideType.SOCIAL}>Social</SelectItem>
                  <SelectItem value={RideType.COMPETITIVE}>Competitive</SelectItem>
                  <SelectItem value={RideType.ADVENTURE}>Adventure</SelectItem>
                  <SelectItem value={RideType.MAINTENANCE}>Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as RideDifficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RideDifficulty.BEGINNER}>Beginner</SelectItem>
                  <SelectItem value={RideDifficulty.INTERMEDIATE}>Intermediate</SelectItem>
                  <SelectItem value={RideDifficulty.ADVANCED}>Advanced</SelectItem>
                  <SelectItem value={RideDifficulty.EXPERT}>Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the ride, pace expectations, safety notes..."
              rows={4}
              {...register('description', {
                maxLength: { value: 1000, message: 'Description must be less than 1000 characters' },
              })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('startDate', {
                  required: 'Start date is required',
                  validate: (value) => {
                    const selectedDate = new Date(value)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return selectedDate >= today || 'Start date must be in the future'
                  },
                })}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime', {
                  required: 'Start time is required',
                })}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="durationHours" className="text-xs text-muted-foreground">Hours</Label>
                <Select 
                  value={durationHours.toString()} 
                  onValueChange={(value) => setDurationHours(parseInt(value))}
                >
                  <SelectTrigger id="durationHours">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour} {hour === 1 ? 'hr' : 'hrs'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes" className="text-xs text-muted-foreground">Minutes</Label>
                <Select 
                  value={durationMinutes.toString()} 
                  onValueChange={(value) => setDurationMinutes(parseInt(value))}
                >
                  <SelectTrigger id="durationMinutes">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((minute) => (
                      <SelectItem key={minute} value={minute.toString()}>
                        {minute} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Point */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Point</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingPointName">
              Location Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="meetingPointName"
              placeholder="Cronulla Station"
              {...register('meetingPoint.name', {
                required: 'Location name is required',
              })}
            />
            {errors.meetingPoint?.name && (
              <p className="text-sm text-red-500">{errors.meetingPoint.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingPointAddress">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="meetingPointAddress"
              placeholder="Cronulla NSW 2230"
              {...register('meetingPoint.address', {
                required: 'Address is required',
              })}
            />
            {errors.meetingPoint?.address && (
              <p className="text-sm text-red-500">{errors.meetingPoint.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingPointInstructions">Instructions (optional)</Label>
            <Textarea
              id="meetingPointInstructions"
              placeholder="Meet at main entrance"
              rows={2}
              {...register('meetingPoint.instructions')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Route (Optional - Simple for MVP) */}
      <Card>
        <CardHeader>
          <CardTitle>Route (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routeName">Route Name</Label>
            <Input
              id="routeName"
              placeholder="Royal National Park Loop"
              {...register('route.name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routeDistance">Distance (km)</Label>
            <Input
              id="routeDistance"
              type="number"
              min="0"
              step="0.1"
              placeholder="50"
              {...register('route.distance', {
                valueAsNumber: true,
                min: { value: 0, message: 'Distance must be positive' },
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routeNotes">Route Link or Notes</Label>
            <Textarea
              id="routeNotes"
              placeholder="Paste a Strava link or describe the route..."
              rows={3}
              {...register('route.notes')}
            />
            <p className="text-xs text-muted-foreground">
              Share a link to the route or add any additional route information
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants (optional)</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="2"
              max="100"
              placeholder="20"
              {...register('maxParticipants', {
                valueAsNumber: true,
                min: { value: 2, message: 'Must allow at least 2 participants' },
                max: { value: 100, message: 'Maximum 100 participants' },
              })}
            />
            {errors.maxParticipants && (
              <p className="text-sm text-red-500">{errors.maxParticipants.message}</p>
            )}
          </div>

          {canPublish && mode === 'create' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="publishImmediately"
                checked={publishImmediately}
                onCheckedChange={(checked) => setPublishImmediately(checked as boolean)}
              />
              <Label htmlFor="publishImmediately" className="cursor-pointer">
                Publish immediately (make visible to all members)
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'edit' ? 'Save Changes' : (publishImmediately ? 'Publish Ride' : 'Save Draft')}
        </Button>
      </div>
    </form>
  )
}
