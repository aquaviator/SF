import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StripeCheckoutProps {
  seatsToAdd: number;
  totalAmount: number;
  onSuccess: (paymentIntentId: string) => void;
}

export function StripeCheckout({ seatsToAdd, totalAmount, onSuccess }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.log(`⚠️ STRIPE_NOT_READY: stripe: ${!!stripe}, elements: ${!!elements}`);
      return;
    }

    console.log(`💳 SUBMITTING_STRIPE_PAYMENT: amount: £${(totalAmount / 100).toFixed(2)}, seats: ${seatsToAdd}`);
    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/owner/subscription?payment=success',
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ STRIPE_PAYMENT_ERROR:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log(`✅ STRIPE_PAYMENT_SUCCESS: paymentIntent.id: ${paymentIntent.id}, status: ${paymentIntent.status}`);
        onSuccess(paymentIntent.id);
      } else {
        console.log(`⚠️ PAYMENT_STATUS_UNEXPECTED: status: ${paymentIntent?.status}`);
      }
    } catch (error) {
      console.error('❌ STRIPE_PAYMENT_EXCEPTION:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Seats to add:</span>
              <span>{seatsToAdd}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cost per seat:</span>
              <span>£3.00/month</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>£{(totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement 
              options={{
                fields: {
                  billingDetails: {
                    address: {
                      postalCode: 'never' // This will hide postal code field to avoid validation issues
                    }
                  }
                }
              }}
            />
            
            <Button 
              type="submit" 
              disabled={!stripe || isLoading} 
              className="w-full"
            >
              {isLoading ? "Processing Payment..." : `Pay £${(totalAmount / 100).toFixed(2)}`}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}