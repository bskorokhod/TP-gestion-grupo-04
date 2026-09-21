package EsNuestro.user;

import EsNuestro.config.security.JwtService;
import EsNuestro.config.security.JwtUserDetails;
import EsNuestro.user.dtos.*;
import EsNuestro.user.refresh_token.RefreshToken;
import EsNuestro.user.refresh_token.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Optional;

@Service
@Transactional
public class UserService implements UserDetailsService {

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;

    @Autowired
    UserService(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            RefreshTokenService refreshTokenService
    ) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    var msg = String.format("User with email '%s' not found", email);
                    return new UsernameNotFoundException(msg);
                });

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .build();
    }

    Optional<TokenDTO> createUser(UserCreateDTO data) {
        if (isUserInfoAlreadyInUse(data)) {
            return Optional.empty();
        } else {
            var user = data.asUser(passwordEncoder::encode);
            userRepository.save(user);
            return Optional.of(generateTokens(user));
        }
    }

    private boolean isUserInfoAlreadyInUse(UserCreateDTO data) {
        return userRepository.findByEmail(data.email()).isPresent();
    }

    Optional<TokenDTO> loginUser(UserCredentials data) {
        Optional<User> maybeUser = userRepository.findByEmail(data.email());
        return maybeUser
                .filter(user -> passwordEncoder.matches(data.password(), user.getPassword()))
                .map(this::generateTokens);
    }

    Optional<TokenDTO> refresh(RefreshDTO data) {
        return refreshTokenService.findByValue(data.refreshToken())
                .map(RefreshToken::user)
                .map(this::generateTokens);
    }

    private TokenDTO generateTokens(User user) {
        String accessToken = jwtService.createToken(new JwtUserDetails(
                user.getEmail(),
                user.getRole()
        ));
        RefreshToken refreshToken = refreshTokenService.createFor(user);
        return new TokenDTO(accessToken, refreshToken.value());
    }

    public Optional<UserDTO> getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserDTO::new);
    }

    public Optional<UserDTO> updatePhoto(String email, UserPhotoUpdateDTO data) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setPhotoUrl(data.newUrl());
                    userRepository.save(user);
                    return new UserDTO(user);
                });
    }

}
