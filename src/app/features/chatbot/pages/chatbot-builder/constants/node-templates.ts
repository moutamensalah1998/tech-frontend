import { FlowNodeType } from '../../../../../core/models/chatbot.model';

export interface NodeTemplate {
  id: string;
  name: string;
  type: FlowNodeType;
  icon: string;
  preview: string;
  description?: string;
  data: {
    body_message?: any;
    body_question?: any;
    body_button?: any;
  };
  category: string;
  isCustom?: boolean;
}

export const PREDEFINED_TEMPLATES: NodeTemplate[] = [
  // Message Templates
  {
    id: 'welcome_message',
    name: 'Welcome Message',
    type: 'message',
    icon: '👋',
    preview: 'Hello! Welcome to our service...',
    description: 'A friendly greeting message',
    category: 'Greetings',
    data: {
      body_message: {
        content_items: [
          {
            type: 'text',
            order: 0,
            content: {
              text_body: 'Hello! Welcome to our service. How can I help you today?'
            }
          }
        ]
      }
    }
  },
  {
    id: 'thank_you_message',
    name: 'Thank You',
    type: 'message',
    icon: '🙏',
    preview: 'Thank you for contacting us...',
    description: 'Thank you message',
    category: 'Greetings',
    data: {
      body_message: {
        content_items: [
          {
            type: 'text',
            order: 0,
            content: {
              text_body: 'Thank you for contacting us. We appreciate your message!'
            }
          }
        ]
      }
    }
  },
  {
    id: 'goodbye_message',
    name: 'Goodbye',
    type: 'message',
    icon: '👋',
    preview: 'Thank you! Have a great day...',
    description: 'Farewell message',
    category: 'Greetings',
    data: {
      body_message: {
        content_items: [
          {
            type: 'text',
            order: 0,
            content: {
              text_body: 'Thank you! Have a great day!'
            }
          }
        ]
      }
    }
  },
  // Question Templates
  {
    id: 'yes_no_question',
    name: 'Yes/No Question',
    type: 'question',
    icon: '❓',
    preview: 'Would you like to continue?',
    description: 'Simple yes/no question',
    category: 'Questions',
    data: {
      body_question: {
        question_text: 'Would you like to continue?',
        answer_variant: 'yes_no',
        accept_media_response: false,
        save_to_variable: false,
        variable_name: ''
      }
    }
  },
  {
    id: 'rating_question',
    name: 'Rating Question',
    type: 'question',
    icon: '⭐',
    preview: 'How would you rate your experience?',
    description: 'Rating scale question',
    category: 'Questions',
    data: {
      body_question: {
        question_text: 'How would you rate your experience? (1-5)',
        answer_variant: 'rating',
        accept_media_response: false,
        save_to_variable: false,
        variable_name: ''
      }
    }
  },
  {
    id: 'contact_preference',
    name: 'Contact Preference',
    type: 'question',
    icon: '📞',
    preview: 'How would you like us to contact you?',
    description: 'Contact method question',
    category: 'Questions',
    data: {
      body_question: {
        question_text: 'How would you like us to contact you?',
        answer_variant: 'email_phone_sms',
        accept_media_response: false,
        save_to_variable: false,
        variable_name: ''
      }
    }
  },
  // Interactive Buttons Templates
  {
    id: 'main_menu',
    name: 'Main Menu',
    type: 'interactive_buttons',
    icon: '📋',
    preview: 'How can I help you?',
    description: 'Main navigation menu',
    category: 'Navigation',
    data: {
      body_button: {
        type: 'button',
        body: {
          text: 'How can I help you?'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'support',
                title: 'Support',
                next_node_id: null
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'sales',
                title: 'Sales',
                next_node_id: null
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'faq',
                title: 'FAQ',
                next_node_id: null
              }
            }
          ]
        }
      }
    }
  },
  {
    id: 'order_actions',
    name: 'Order Actions',
    type: 'interactive_buttons',
    icon: '📦',
    preview: 'What would you like to do?',
    description: 'Order management options',
    category: 'Actions',
    data: {
      body_button: {
        type: 'button',
        body: {
          text: 'What would you like to do?'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'track',
                title: 'Track Order',
                next_node_id: null
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'cancel',
                title: 'Cancel Order',
                next_node_id: null
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'return',
                title: 'Return Item',
                next_node_id: null
              }
            }
          ]
        }
      }
    }
  },
  {
    id: 'support_options',
    name: 'Support Options',
    type: 'interactive_buttons',
    icon: '💬',
    preview: 'Choose an option:',
    description: 'Support channel selection',
    category: 'Support',
    data: {
      body_button: {
        type: 'button',
        body: {
          text: 'Choose an option:'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'chat',
                title: 'Chat',
                next_node_id: null
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'email',
                title: 'Email',
                next_node_id: null
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'call',
                title: 'Call',
                next_node_id: null
              }
            }
          ]
        }
      }
    }
  }
];

