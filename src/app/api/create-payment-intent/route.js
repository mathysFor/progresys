import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFormationPriceCents, getFormationById } from '../../../lib/config/formations.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request) {
  try {
    const body = await request.json();
    const { formationId, formationIds, email, metadata } = body;

    // Support both single formationId (backward compatibility) and multiple formationIds
    const formationsToProcess = formationIds || (formationId ? [formationId] : []);

    if (formationsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'At least one formation ID is required' },
        { status: 400 }
      );
    }

    // Vérifier que toutes les formations existent et calculer le total
    let totalAmount = 0;
    for (const id of formationsToProcess) {
      const formation = getFormationById(id);
      if (!formation) {
        return NextResponse.json(
          { error: `Formation ${id} not found` },
          { status: 400 }
        );
      }
      totalAmount += formation.priceCents;
    }

    const amount = totalAmount;

    // Créer un Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        formationIds: formationsToProcess.join(','), // Store as comma-separated string
        formationCount: formationsToProcess.length.toString(),
        email: email || '',
        ...metadata,
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100, // Retourner le montant en euros pour affichage
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

