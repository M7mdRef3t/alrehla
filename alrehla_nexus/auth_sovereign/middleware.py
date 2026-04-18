import jwt
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.models import User, AnonymousUser
from django.utils.deprecation import MiddlewareMixin

class SupabaseJwtMiddleware(MiddlewareMixin):
    """
    Middleware to validate Supabase JWT tokens.
    Expects 'Authorization: Bearer <token>'
    """
    def process_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            request.user = AnonymousUser()
            return None

        token = auth_header.split(' ')[1]
        
        try:
            # Decode the Supabase JWT
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=["HS256"],
                options={"verify_aud": False} # Supabase often uses 'authenticated' as aud
            )
            
            # Map Supabase ID (sub) to a Django User
            # For a truly 'sovereign' experience, we might not want to create records 
            # unless needed, but for Django compatibility, we can use a Virtual User 
            # or fetch/create a real one.
            supabase_id = payload.get('sub')
            
            if supabase_id:
                # Basic implementation: find or create a user by username=supabase_id
                user, created = User.objects.get_or_create(username=supabase_id)
                request.user = user
            else:
                request.user = AnonymousUser()
                
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token has expired'}, status=401)
        except jwt.InvalidTokenError as e:
            return JsonResponse({'error': f'Invalid token: {str(e)}'}, status=401)
        except Exception as e:
            return JsonResponse({'error': 'Authentication failed'}, status=500)

        return None
