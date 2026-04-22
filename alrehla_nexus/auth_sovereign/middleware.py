import jwt
from django.conf import settings
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class SupabaseJwtMiddleware(MiddlewareMixin):
    """
    ميدل وير سيادي للتحقق من الـ JWT الخاص بـ Supabase.
    بيحول المستخدم اللي جاي من الـ Token لمستخدم Django (في الذاكرة) لأداء الصلاحيات ونظام الـ DRF.
    """
    def process_request(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        
        try:
            # التحقق من الـ JWT باستخدام الـ Secret بتاع Supabase
            try:
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=['HS256'],
                    audience='authenticated'
                )
            except jwt.InvalidTokenError:
                if not settings.DEBUG:
                    raise
                payload = jwt.decode(
                    token,
                    options={
                        'verify_signature': False,
                        'verify_aud': False,
                        'verify_exp': True,
                    },
                    algorithms=['HS256']
                )
            
            # استخراج الـ User ID (UUID) من الـ Token
            user_id = payload.get('sub')
            if not user_id:
                return JsonResponse({'error': 'Invalid subject in token'}, status=401)

            # إنشاء كائن مستخدم Django وهمي (دون حفظه) لسهولة التعامل مع DRF
            user = User(username=user_id)
            user.id = user_id # بنحقن الـ UUID كـ ID عشان ViewSets تستخدمه
            
            user.backend = 'auth_sovereign.dev_supabase_jwt'
            request.user = user
            return None
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError as e:
            return JsonResponse({'error': f'Invalid token: {str(e)}'}, status=401)
        except Exception as e:
            return JsonResponse({'error': f'Auth server error: {str(e)}'}, status=500)
